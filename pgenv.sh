# To make these variables persistently available in your current terminal session,
# source this script rather than running it as a standalone executable.
# Usage: source ./pgenv.sh

supaenv() {
    export PGHOST=127.0.0.1
    export PGPORT=54322
    export PGUSER=supabase_admin
    export PGPASSWORD=postgres
    export PGDATABASE=postgres
    echo "PostgreSQL environment variables set."
}
