#!/usr/bin/env bash
# Packages every Lambda's handler.py + the shared/ modules it needs into
# backend/build/<function>/, which is what terraform/backend/lambda.tf's
# archive_file data sources zip up. Run this BEFORE `terraform apply` —
# Terraform has no way to create these directories itself, it only zips
# whatever's already there.
#
# Usage (from anywhere):
#   bash backend/scripts/package_lambdas.sh
#
# This is also what .github/workflows/deploy.yml runs in CI — keeping the
# packaging logic in one script means local applies and CI applies always
# produce identical zips.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

echo "Packaging Lambdas in $BACKEND_DIR/build/ ..."
rm -rf build
mkdir -p build

# Functions that only need boto3 (already provided by the Lambda runtime)
# — no extra pip install needed for these.
LIGHTWEIGHT_FUNCTIONS="documents_upload documents_list documents_get documents_delete documents_approve chat_create_session chat_get_sessions chat_get_messages chat_get_message feedback_submit"

for fn in $LIGHTWEIGHT_FUNCTIONS; do
  src_dir=$(echo "$fn" | sed 's/_/\//') # e.g. documents_upload -> documents/upload
  mkdir -p "build/$fn"
  cp "src/$src_dir/handler.py" "build/$fn/"
  cp src/shared/*.py "build/$fn/"
done
echo "Packaged (no extra deps): $LIGHTWEIGHT_FUNCTIONS"

# chat_send_message imports shared/vector_store.py (OpenSearch search),
# which needs opensearch-py bundled — it's not part of the Lambda runtime.
mkdir -p build/chat_send_message
cp src/chat/send_message/handler.py build/chat_send_message/
cp src/shared/*.py build/chat_send_message/
pip install "opensearch-py>=2.6" -t build/chat_send_message --quiet
echo "Packaged (with opensearch-py): chat_send_message"

# ingestion_processor imports vector_store.py (opensearch-py) AND does its
# own PDF/DOCX text extraction (pypdf, python-docx) — needs all three.
mkdir -p build/ingestion_processor
cp src/ingestion/processor/handler.py build/ingestion_processor/
cp src/shared/*.py build/ingestion_processor/
pip install -r requirements-lambda.txt -t build/ingestion_processor --quiet
echo "Packaged (with opensearch-py, pypdf, python-docx): ingestion_processor"

echo ""
echo "Done. Built $(ls build | wc -l | tr -d ' ') function directories under $BACKEND_DIR/build/"
echo "You can now run: cd terraform/backend && terraform apply"