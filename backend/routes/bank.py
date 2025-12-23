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
