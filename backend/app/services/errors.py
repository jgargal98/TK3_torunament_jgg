class NotFoundError(Exception):
    """The requested resource does not exist (HTTP 404)."""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class RuleError(Exception):
    """An operation breaks a tournament rule (HTTP 400 by default, 409 for state conflicts)."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
