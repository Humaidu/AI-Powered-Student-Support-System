"""
API Gateway's built-in Cognito JWT authorizer (configured in api_gateway.tf)
validates the token on every request *before* the Lambda ever runs, so
handlers never verify signatures themselves — they just read the already-
verified claims off the event. This module centralizes that extraction.
"""


class AuthError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)


def get_claims(event: dict) -> dict:
    """Pulls the verified JWT claims dict out of an HTTP API v2 event.
    Raises AuthError if the request somehow reached the Lambda without
    having passed through the authorizer (shouldn't happen in practice,
    since routes that need auth are configured with the authorizer attached)."""
    try:
        return event["requestContext"]["authorizer"]["jwt"]["claims"]
    except KeyError:
        raise AuthError("Missing or invalid authentication token")


def get_user_id(event: dict) -> str:
    """Cognito's 'sub' claim is the stable, unique user id."""
    claims = get_claims(event)
    user_id = claims.get("sub")
    if not user_id:
        raise AuthError("Token missing subject claim")
    return user_id


def get_role(event: dict) -> str:
    """Role is stored as a custom Cognito attribute (custom:role),
    set to STUDENT or ADMIN at signup / by an admin. Defaults to
    STUDENT if somehow unset, which is the least-privileged choice."""
    claims = get_claims(event)
    return claims.get("custom:role", "STUDENT")


def require_admin(event: dict) -> str:
    """Returns the user id if the caller is an ADMIN, else raises AuthError.
    Used by document upload/delete/approve handlers."""
    user_id = get_user_id(event)
    if get_role(event) != "ADMIN":
        raise AuthError("This action requires ADMIN role")
    return user_id
