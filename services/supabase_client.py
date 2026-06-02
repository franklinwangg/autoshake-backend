import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_url = os.getenv("SUPABASE_URL")
_key = os.getenv("SUPABASE_PUBLISHABLE_KEY")
_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not _url or not _key:
    raise RuntimeError("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set in .env")

supabase: Client = create_client(_url, _key)

# Bypasses RLS — only use for trusted server-side writes.
supabase_admin: Client = create_client(_url, _service_key) if _service_key else None
