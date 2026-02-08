"""
Migration: Create emails table
Version: 002
Description: Creates the emails table for the email client
"""

import sqlite3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import DATABASE_PATH


def upgrade():
    """Apply the migration."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT 1 FROM _migrations WHERE name = ?", ("002_create_emails_table",))
    if cursor.fetchone():
        print("Migration 002_create_emails_table already applied. Skipping.")
        conn.close()
        return

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_name TEXT NOT NULL,
            sender_email TEXT NOT NULL,
            recipient_name TEXT NOT NULL,
            recipient_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            preview TEXT,
            is_read INTEGER DEFAULT 0,
            is_archived INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            attachment_name TEXT,
            attachment_size TEXT
        )
    """)

    # Seed demo emails
    demo_emails = [
        (
            "Jane Doe",
            "jane.doe@business.com",
            "Richard Brown",
            "richard.brown@company.com",
            "Proposal for Partnership ✨",
            """Hi John, hope this message finds you well!

I'm reaching out to explore a potential partnership between our companies. I believe there's a strong alignment in our goals and we could create significant value together.

I've attached a detailed proposal for your review. Would you be available for a brief call next week to discuss?

Looking forward to hearing from you.

Best regards,
Jane Doe""",
            "I'm reaching out to explore a potential partnership between our companies...",
            0, 0,
            "Proposal Partnership.pdf",
            "1.5 MB",
        ),
        (
            "Michael Lee",
            "michael.lee@vendor.com",
            "Richard Brown",
            "richard.brown@company.com",
            "Follow-Up: Product Demo Feedba...",
            "Hi Richard, I wanted to follow up on our product demo last week...",
            "I wanted to follow up on our product demo last week...",
            1, 0,
            None,
            None,
        ),
        (
            "Support Team",
            "support@service.com",
            "Richard Brown",
            "richard.brown@company.com",
            "Contract Renewal Due 🗓️",
            "Your annual contract is up for renewal. Please review the attached terms...",
            "Your annual contract is up for renewal...",
            1, 0,
            None,
            None,
        ),
        (
            "Downe Johnson",
            "downe.j@client.org",
            "Richard Brown",
            "richard.brown@company.com",
            "Q4 Budget Approval Request 📊",
            "Hi Richard, I need your sign-off on the Q4 budget proposal...",
            "I need your sign-off on the Q4 budget proposal...",
            0, 0,
            None,
            None,
        ),
    ]

    for i, row in enumerate(demo_emails):
        modifier = f"-{i} days"
        cursor.execute(
            """INSERT INTO emails (sender_name, sender_email, recipient_name, recipient_email,
               subject, body, preview, is_read, is_archived, attachment_name, attachment_size, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))""",
            (*row, modifier),
        )

    cursor.execute("INSERT INTO _migrations (name) VALUES (?)", ("002_create_emails_table",))

    conn.commit()
    conn.close()
    print("Migration 002_create_emails_table applied successfully.")


def downgrade():
    """Revert the migration."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS emails")
    cursor.execute("DELETE FROM _migrations WHERE name = ?", ("002_create_emails_table",))

    conn.commit()
    conn.close()
    print("Migration 002_create_emails_table reverted successfully.")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["upgrade", "downgrade"])
    args = parser.parse_args()
    upgrade() if args.action == "upgrade" else downgrade()
