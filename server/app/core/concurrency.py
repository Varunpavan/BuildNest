import asyncio


class ConcurrencyManager:
    """
    Prevents overlapping generative builds on the same project ID.
    Thread-safe and async-safe across coroutines.
    """
    def __init__(self):
        self._active = set()
        self._lock = asyncio.Lock()

    async def acquire(self, project_id: str) -> bool:
        async with self._lock:
            if project_id in self._active:
                return False
            self._active.add(project_id)
            return True

    async def release(self, project_id: str):
        async with self._lock:
            self._active.discard(project_id)

    async def is_active(self, project_id: str) -> bool:
        async with self._lock:
            return project_id in self._active


concurrency_manager = ConcurrencyManager()
