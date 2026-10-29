"""auth: users, refresh sessions, ownership

Revision ID: b9960dfcbb27
Revises: ddccf89293ad
Create Date: 2026-10-30 02:06:48.035633

Добавляет таблицы пользователей и refresh-сессий, а также столбец
``user_id`` в финансовые таблицы: все данные теперь принадлежат
конкретному пользователю. Уникальные ограничения переведены на
пользовательскую область видимости ((user_id, name, type) у категорий,
(user_id, category_id, month) у бюджетов).

Столбцы добавляются как nullable и лишь затем делаются NOT NULL через
``batch_alter_table``: проект не содержит данных для бэкфилла, а batch
режим обеспечивает совместимость и с PostgreSQL, и с SQLite.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b9960dfcbb27"
down_revision: str | Sequence[str] | None = "ddccf89293ad"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Создаёт пользователей и refresh-сессии, добавляет владение данными."""
    op.create_table(
        "users",
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("display_name", sa.String(length=100), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "refresh_sessions",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_refresh_sessions_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_refresh_sessions")),
    )
    op.create_index(
        op.f("ix_refresh_sessions_token_hash"), "refresh_sessions", ["token_hash"], unique=True
    )
    op.create_index(
        op.f("ix_refresh_sessions_user_id"), "refresh_sessions", ["user_id"], unique=False
    )

    op.add_column("budgets", sa.Column("user_id", sa.Integer(), nullable=True))
    op.add_column("categories", sa.Column("user_id", sa.Integer(), nullable=True))
    op.add_column("transactions", sa.Column("user_id", sa.Integer(), nullable=True))

    with op.batch_alter_table("budgets") as batch:
        batch.drop_constraint(op.f("uq_budgets_category_id"), type_="unique")
        batch.alter_column("user_id", existing_type=sa.Integer(), nullable=False)
        batch.create_unique_constraint(
            op.f("uq_budgets_user_id"), ["user_id", "category_id", "month"]
        )
        batch.create_foreign_key(
            op.f("fk_budgets_user_id_users"), "users", ["user_id"], ["id"], ondelete="CASCADE"
        )
    op.create_index(op.f("ix_budgets_user_id"), "budgets", ["user_id"], unique=False)

    with op.batch_alter_table("categories") as batch:
        batch.drop_constraint(op.f("uq_categories_name"), type_="unique")
        batch.alter_column("user_id", existing_type=sa.Integer(), nullable=False)
        batch.create_unique_constraint(
            op.f("uq_categories_user_id"), ["user_id", "name", "type"]
        )
        batch.create_foreign_key(
            op.f("fk_categories_user_id_users"), "users", ["user_id"], ["id"], ondelete="CASCADE"
        )
    op.create_index(op.f("ix_categories_user_id"), "categories", ["user_id"], unique=False)

    with op.batch_alter_table("transactions") as batch:
        batch.alter_column("user_id", existing_type=sa.Integer(), nullable=False)
        batch.create_foreign_key(
            op.f("fk_transactions_user_id_users"), "users", ["user_id"], ["id"], ondelete="CASCADE"
        )
    op.create_index(op.f("ix_transactions_user_id"), "transactions", ["user_id"], unique=False)


def downgrade() -> None:
    """Возвращает схему к состоянию до аутентификации (данные теряются)."""
    op.drop_index(op.f("ix_transactions_user_id"), table_name="transactions")
    with op.batch_alter_table("transactions") as batch:
        batch.drop_constraint(
            op.f("fk_transactions_user_id_users"), type_="foreignkey"
        )
        batch.drop_column("user_id")

    op.drop_index(op.f("ix_categories_user_id"), table_name="categories")
    with op.batch_alter_table("categories") as batch:
        batch.drop_constraint(
            op.f("fk_categories_user_id_users"), type_="foreignkey"
        )
        batch.drop_constraint(op.f("uq_categories_user_id"), type_="unique")
        batch.alter_column("user_id", existing_type=sa.Integer(), nullable=True)
        batch.drop_column("user_id")
        batch.create_unique_constraint(op.f("uq_categories_name"), ["name", "type"])

    op.drop_index(op.f("ix_budgets_user_id"), table_name="budgets")
    with op.batch_alter_table("budgets") as batch:
        batch.drop_constraint(op.f("fk_budgets_user_id_users"), type_="foreignkey")
        batch.drop_constraint(op.f("uq_budgets_user_id"), type_="unique")
        batch.alter_column("user_id", existing_type=sa.Integer(), nullable=True)
        batch.drop_column("user_id")
        batch.create_unique_constraint(op.f("uq_budgets_category_id"), ["category_id", "month"])

    op.drop_index(op.f("ix_refresh_sessions_user_id"), table_name="refresh_sessions")
    op.drop_index(op.f("ix_refresh_sessions_token_hash"), table_name="refresh_sessions")
    op.drop_table("refresh_sessions")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
