"""Loads a handler.py by explicit path under a unique module name, since
every Lambda folder has a file literally named handler.py — plain
`import handler` would collide across test files in the same pytest run."""
import importlib.util
import os
import sys

_SHARED_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "shared")
if _SHARED_PATH not in sys.path:
    sys.path.insert(0, _SHARED_PATH)


def load_handler(*path_parts: str):
    """path_parts, e.g. load_handler('documents', 'upload') for
    src/documents/upload/handler.py"""
    module_name = "handler_" + "_".join(path_parts)
    path = os.path.join(os.path.dirname(__file__), "..", "src", *path_parts, "handler.py")
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module
