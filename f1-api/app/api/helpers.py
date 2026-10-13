from datetime import date

from flask import abort, request

from ..extensions import db


class ApiError(Exception):
    """Erro de negocio que vira resposta JSON padronizada."""

    def __init__(self, message, status_code=400, details=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


def parse_json_body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError("Corpo JSON valido e obrigatorio")
    return data


def validate_fields(data, allowed, required=()):
    missing = [f for f in required if data.get(f) in (None, "")]
    if missing:
        raise ApiError(
            "Campos obrigatorios ausentes",
            details={"missing_fields": missing},
        )
    unknown = [k for k in data if k not in allowed]
    if unknown:
        raise ApiError(
            "Campos nao suportados",
            details={"unknown_fields": unknown},
        )
    return data


def parse_date(value, field):
    if value in (None, ""):
        return None
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        raise ApiError(
            f"Campo '{field}' deve estar no formato YYYY-MM-DD"
        )


def parse_int(value, field):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        raise ApiError(f"Campo '{field}' deve ser um inteiro")


def pagination_args():
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))
    except ValueError:
        raise ApiError("Parametros 'page' e 'per_page' devem ser inteiros")
    page = max(page, 1)
    per_page = min(max(per_page, 1), 50)
    return page, per_page


def paginate(query, serialize):
    page, per_page = pagination_args()
    p = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "data": [serialize(item) for item in p.items],
        "meta": {
            "page": p.page,
            "per_page": p.per_page,
            "total": p.total,
            "pages": p.pages,
        },
    }


def get_or_404(model, record_id, description="Recurso nao encontrado"):
    instance = db.session.get(model, record_id)
    if instance is None:
        abort(404, description=description)
    return instance


def commit_unique(err_message):
    from sqlalchemy.exc import IntegrityError

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise ApiError(err_message, 409)
