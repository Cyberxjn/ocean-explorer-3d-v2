"""A deliberately small in-memory cache with time-based expiry.

Good enough for a single-process dev/demo backend: avoids re-hitting the
Argovis API for identical requests within CACHE_TTL_SECONDS. Not shared
across multiple worker processes — if you deploy this behind several
uvicorn workers, swap this for Redis or similar.
"""

import time
from typing import Any, Callable, Optional


class TTLCache:
    def __init__(self, ttl_seconds: int = 900):
        self.ttl_seconds = ttl_seconds
        self._store: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if not entry:
            return None
        expires_at, value = entry
        if time.time() > expires_at:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        self._store[key] = (time.time() + self.ttl_seconds, value)

    async def get_or_set_async(self, key: str, factory: Callable[[], Any]) -> Any:
        cached = self.get(key)
        if cached is not None:
            return cached
        value = await factory()
        self.set(key, value)
        return value

    def clear(self) -> None:
        self._store.clear()

    def size(self) -> int:
        return len(self._store)
