import json
import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(__file__))
from _load import load_handler

os.environ.setdefault("TABLE_NAME", "test-table")
os.environ.setdefault("BEDROCK_MODEL_ID", "test-model")
os.environ.setdefault("BEDROCK_EMBEDDING_MODEL_ID", "test-embed-model")
os.environ.setdefault("OPENSEARCH_ENDPOINT", "https://test-endpoint")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")

handler = load_handler("chat", "send_message")


def _event(body: dict, sub="student-1"):
    return {
        "body": json.dumps(body),
        "requestContext": {"authorizer": {"jwt": {"claims": {"sub": sub, "custom:role": "STUDENT"}}}},
    }


@patch("handler_chat_send_message.put_message")
@patch("handler_chat_send_message.generate_answer")
@patch("handler_chat_send_message.search")
@patch("handler_chat_send_message.embed_text")
@patch("handler_chat_send_message.get_session_owner")
def test_send_message_success(mock_owner, mock_embed, mock_search, mock_generate, mock_put):
    mock_owner.return_value = "student-1"
    mock_embed.return_value = [0.1, 0.2, 0.3]
    mock_search.return_value = [{"documentId": "doc-1", "chunkId": "chunk-1", "content": "Library hours are 8am-9pm.", "pageNumber": 1}]
    mock_generate.return_value = "The library is open from 8am to 9pm."
    mock_put.side_effect = [
        {"messageId": "m1"},
        {"messageId": "m2", "createdAt": 1700000000},
    ]

    result = handler.lambda_handler(
        _event({"sessionId": "sess-1", "message": "When is the library open?"}), None
    )

    assert result["statusCode"] == 201
    body = json.loads(result["body"])
    assert body["data"]["answer"] == "The library is open from 8am to 9pm."
    assert len(body["data"]["sources"]) == 1


@patch("handler_chat_send_message.get_session_owner")
def test_send_message_wrong_owner(mock_owner):
    mock_owner.return_value = "someone-else"

    result = handler.lambda_handler(
        _event({"sessionId": "sess-1", "message": "When is the library open?"}), None
    )
    assert result["statusCode"] == 403


@patch("handler_chat_send_message.get_session_owner")
def test_send_message_session_not_found(mock_owner):
    mock_owner.return_value = None

    result = handler.lambda_handler(
        _event({"sessionId": "does-not-exist", "message": "Hello?"}), None
    )
    assert result["statusCode"] == 404


def test_send_message_missing_message():
    result = handler.lambda_handler(_event({"sessionId": "sess-1"}), None)
    assert result["statusCode"] == 400
