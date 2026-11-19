import pytest
from app.core.concurrency import ConcurrencyManager


@pytest.mark.anyio
async def test_concurrency_lock():
    mgr = ConcurrencyManager()
    project_id = "proj_test_123"

    # Initially unlocked
    assert await mgr.is_active(project_id) is False

    # Acquire lock
    acquired = await mgr.acquire(project_id)
    assert acquired is True
    assert await mgr.is_active(project_id) is True

    # Duplicate acquisition fails
    second_acquire = await mgr.acquire(project_id)
    assert second_acquire is False

    # Release lock
    await mgr.release(project_id)
    assert await mgr.is_active(project_id) is False
