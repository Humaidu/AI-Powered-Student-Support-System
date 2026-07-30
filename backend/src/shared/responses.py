"""Standard API response envelope, matching ARCHITECTURE.md section 7:
{success, message, data} for 2xx, {success, error:{code, message}} for errors.
"""
import json
from decimal import Decimal


class _DecimalEncoder(json.JSONEncoder):
    """DynamoDB returns numbers as Decimal; JSON doesn't know that type."""
    def default(self, o):
        if isinstance(o, Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def _envelope(status_code: int, payload: dict) -> dict:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(payload, cls=_DecimalEncoder),
    }


def ok(data=None, message="Operation successful", status_code=200) -> dict:
    return _envelope(status_code, {"success": True, "message": message, "data": data or {}})


def created(data=None, message="Resource created") -> dict:
    return ok(data=data, message=message, status_code=201)


def error(code: str, message: str, status_code: int) -> dict:
    return _envelope(status_code, {"success": False, "error": {"code": code, "message": message}})


def bad_request(message: str, code: str = "BAD_REQUEST") -> dict:
    return error(code, message, 400)


def unauthorized(message: str = "Authentication required", code: str = "UNAUTHORIZED") -> dict:
    return error(code, message, 401)


def forbidden(message: str = "You do not have permission to perform this action", code: str = "FORBIDDEN") -> dict:
    return error(code, message, 403)


def not_found(message: str = "Resource not found", code: str = "NOT_FOUND") -> dict:
    return error(code, message, 404)


def server_error(message: str = "Internal server error", code: str = "INTERNAL_ERROR") -> dict:
    return error(code, message, 500)
