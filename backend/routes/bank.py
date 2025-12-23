from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timezone
import uuid

from models.schemas import (
    User, TransactionType,
    TransactionCreate, TransactionResponse
)
from utils.dependencies import get_current_user, get_admin_user
from utils.database import db

router = APIRouter(tags=["bank"])

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(current_user: User = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": current_user.id}, {"_id": 0}).sort("date", -1).to_list(1000)
    return [TransactionResponse(**t) for t in transactions]

@router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(transaction_data: TransactionCreate, current_user: User = Depends(get_current_user)):
    # Only admin can add transactions
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can add transactions")
    
    last_transaction = await db.transactions.find_one({"user_id": current_user.id}, {"_id": 0}, sort=[("date", -1)])
    current_balance = last_transaction["balance_after"] if last_transaction else 0.0
    
    if transaction_data.type == TransactionType.DEPOSIT:
        new_balance = current_balance + transaction_data.amount
    else:
        new_balance = current_balance - transaction_data.amount
    
    transaction = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "type": transaction_data.type,
        "amount": transaction_data.amount,
        "description": transaction_data.description,
        "category": transaction_data.category,
        "balance_after": new_balance,
        "date": datetime.now(timezone.utc).isoformat()
    }
    await db.transactions.insert_one(transaction)
    return TransactionResponse(**transaction)

@router.get("/bank/balance")
async def get_balance(current_user: User = Depends(get_current_user)):
    last_transaction = await db.transactions.find_one({"user_id": current_user.id}, {"_id": 0}, sort=[("date", -1)])
    balance = last_transaction["balance_after"] if last_transaction else 0.0
    return {"balance": balance}


@router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, admin_user: User = Depends(get_admin_user)):
    """Admin deletes a transaction and recalculates balances"""
    # Find the transaction
    transaction = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    user_id = transaction["user_id"]
    transaction_date = transaction["date"]
    
    # Delete the transaction
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Failed to delete transaction")
    
    # Recalculate all balances for transactions after this one
    # Get all transactions for this user sorted by date
    all_transactions = await db.transactions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("date", 1).to_list(10000)
    
    # Recalculate balances
    running_balance = 0
    for t in all_transactions:
        if t["type"] == "deposit":
            running_balance += t["amount"]
        else:
            running_balance -= t["amount"]
        
        # Update balance_after if different
        if t["balance_after"] != running_balance:
            await db.transactions.update_one(
                {"id": t["id"]},
                {"$set": {"balance_after": running_balance}}
            )
    
    return {"message": "Transaction deleted successfully"}
