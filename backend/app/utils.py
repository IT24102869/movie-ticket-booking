from datetime import datetime, timezone

def utcnow() -> datetime:
    # naive UTC datetime (consistent with MySQL DATETIME without timezone)
    return datetime.utcnow()
