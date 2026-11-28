"""enable_rls_cron_execution_logs

Revision ID: e4f9b2c8a170
Revises: d4f8a91c2e03
Create Date: 2026-11-28 01:17:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e4f9b2c8a170'
down_revision = 'd4f8a91c2e03'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE public.cron_execution_logs ENABLE ROW LEVEL SECURITY")


def downgrade():
    op.execute("ALTER TABLE public.cron_execution_logs DISABLE ROW LEVEL SECURITY")
