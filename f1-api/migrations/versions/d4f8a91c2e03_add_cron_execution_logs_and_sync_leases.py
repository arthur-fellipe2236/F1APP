"""add cron_execution_logs and cron_sync_leases

Revision ID: d4f8a91c2e03
Revises: cc5c2762e5b0
Create Date: 2026-11-24 20:08:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd4f8a91c2e03'
down_revision = 'cc5c2762e5b0'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'cron_execution_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('executed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=64), nullable=False),
        sa.Column('pending_count', sa.Integer(), nullable=True),
        sa.Column('imported_count', sa.Integer(), nullable=True),
        sa.Column('skipped_count', sa.Integer(), nullable=True),
        sa.Column('fencing_token', sa.BigInteger(), nullable=True),
        sa.Column('duration_ms', sa.Integer(), nullable=False),
        sa.Column('error_summary', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('cron_execution_logs', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_cron_execution_logs_executed_at'),
            ['executed_at'],
            unique=False,
        )
        batch_op.create_index(
            batch_op.f('ix_cron_execution_logs_status'),
            ['status'],
            unique=False,
        )

    op.create_table(
        'cron_sync_leases',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('locked_by', sa.String(length=64), nullable=True),
        sa.Column('fencing_token', sa.BigInteger(), nullable=False),
        sa.Column('last_heartbeat', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_successful_sync_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_status', sa.String(length=32), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('cron_sync_leases')
    with op.batch_alter_table('cron_execution_logs', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_cron_execution_logs_status'))
        batch_op.drop_index(batch_op.f('ix_cron_execution_logs_executed_at'))
    op.drop_table('cron_execution_logs')
