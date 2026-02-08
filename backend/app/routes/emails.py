from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.database import get_db

router = APIRouter(prefix="/emails", tags=["emails"])


class EmailCreate(BaseModel):
    sender_name: str
    sender_email: str
    recipient_name: str
    recipient_email: str
    subject: str
    body: str
    attachment_name: Optional[str] = None
    attachment_size: Optional[str] = None


class EmailUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_archived: Optional[bool] = None


def row_to_email(r) -> dict:
    preview = r["preview"] or (r["body"][:100] + "..." if len(r["body"]) > 100 else r["body"])
    return {
        "id": r["id"],
        "sender_name": r["sender_name"],
        "sender_email": r["sender_email"],
        "recipient_name": r["recipient_name"],
        "recipient_email": r["recipient_email"],
        "subject": r["subject"],
        "body": r["body"],
        "preview": preview,
        "is_read": bool(r["is_read"]),
        "is_archived": bool(r["is_archived"]),
        "created_at": r["created_at"],
        "attachment_name": r["attachment_name"],
        "attachment_size": r["attachment_size"],
    }


@router.get("")
def list_emails(tab: Optional[str] = Query(None)):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            if tab == "unread":
                cursor.execute("SELECT * FROM emails WHERE is_archived = 0 AND is_read = 0 ORDER BY created_at DESC")
            elif tab == "archive":
                cursor.execute("SELECT * FROM emails WHERE is_archived = 1 ORDER BY created_at DESC")
            else:
                cursor.execute("SELECT * FROM emails WHERE is_archived = 0 ORDER BY created_at DESC")

            rows = cursor.fetchall()
            return {"emails": [row_to_email(dict(r)) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{email_id}")
def get_email(email_id: int):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM emails WHERE id = ?", (email_id,))
            r = cursor.fetchone()
            if r is None:
                raise HTTPException(status_code=404, detail="Email not found")
            return row_to_email(dict(r))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", status_code=201)
def create_email(email: EmailCreate):
    try:
        preview = email.body[:100] + "..." if len(email.body) > 100 else email.body
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """INSERT INTO emails (sender_name, sender_email, recipient_name, recipient_email,
                   subject, body, preview, is_read, is_archived, attachment_name, attachment_size)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)""",
                (
                    email.sender_name,
                    email.sender_email,
                    email.recipient_name,
                    email.recipient_email,
                    email.subject,
                    email.body,
                    preview,
                    email.attachment_name,
                    email.attachment_size,
                ),
            )
            email_id = cursor.lastrowid
            cursor.execute("SELECT * FROM emails WHERE id = ?", (email_id,))
            r = cursor.fetchone()
            return row_to_email(dict(r))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{email_id}")
def update_email(email_id: int, update: EmailUpdate):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM emails WHERE id = ?", (email_id,))
            r = cursor.fetchone()
            if r is None:
                raise HTTPException(status_code=404, detail="Email not found")

            updates = []
            params = []
            if update.is_read is not None:
                updates.append("is_read = ?")
                params.append(1 if update.is_read else 0)
            if update.is_archived is not None:
                updates.append("is_archived = ?")
                params.append(1 if update.is_archived else 0)

            if updates:
                params.append(email_id)
                cursor.execute(f"UPDATE emails SET {', '.join(updates)} WHERE id = ?", params)
                cursor.execute("SELECT * FROM emails WHERE id = ?", (email_id,))
                r = cursor.fetchone()

            return row_to_email(dict(r))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{email_id}", status_code=204)
def delete_email(email_id: int):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM emails WHERE id = ?", (email_id,))
            if cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Email not found")
            cursor.execute("DELETE FROM emails WHERE id = ?", (email_id,))
            return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
