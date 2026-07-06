#!/bin/bash

# Konfiguracja
PRISMA_ENGINE_URL="https://github.com/gek64/prisma-engines-freebsd/releases/download/latest/prisma-engines-FreeBSD_14.0-RELEASE_amd64.tar.gz"
SCRIPTS_DIR="./prisma/scripts"
ARCHIVE_PATH="$SCRIPTS_DIR/prisma-engines-FreeBSD_14.0-RELEASE_amd64.tar.gz"
LOCAL_PRISMA_DIR="./node_modules/.prisma/client"
TEMP_DIR="/tmp/prisma-engines"

echo "📥 Preparing Prisma engine for FreeBSD 14..."

# Sprawdź, czy archiwum istnieje
if [ ! -f "$ARCHIVE_PATH" ]; then
  echo "⚠️ Prisma engine archive not found in $SCRIPTS_DIR. Downloading..."
  mkdir -p "$SCRIPTS_DIR"
  curl -Lo "$ARCHIVE_PATH" "$PRISMA_ENGINE_URL" || {
    echo "❌ Failed to download Prisma engine archive from $PRISMA_ENGINE_URL."
    exit 1
  }
  echo "✅ Archive downloaded to $ARCHIVE_PATH"
else
  echo "✅ Prisma engine archive found at $ARCHIVE_PATH"
fi

# Sprawdź, czy archiwum jest poprawnym plikiem tar.gz
if ! tar -tzf "$ARCHIVE_PATH" >/dev/null 2>&1; then
  echo "❌ Archive $ARCHIVE_PATH is corrupted or not a valid tar.gz file."
  exit 1
fi
echo "✅ Archive $ARCHIVE_PATH is valid."

# Utwórz folder tymczasowy do rozpakowania
mkdir -p "$TEMP_DIR"
echo "✅ Created temporary directory $TEMP_DIR"

# Rozpakuj archiwum
tar -xvf "$ARCHIVE_PATH" -C "$TEMP_DIR" || {
  echo "❌ Failed to extract archive $ARCHIVE_PATH to $TEMP_DIR."
  exit 1
}
echo "✅ Extracted archive to $TEMP_DIR"

# Sprawdź, czy plik libquery_engine.so istnieje
if [ -f "$TEMP_DIR/libquery_engine.so" ]; then
  echo "✅ Found libquery_engine.so in $TEMP_DIR"
  # Zmień nazwę pliku libquery_engine.so na libquery_engine.so.node
  mv "$TEMP_DIR/libquery_engine.so" "$TEMP_DIR/libquery_engine.so.node" || {
    echo "❌ Failed to rename libquery_engine.so to libquery_engine.so.node."
    exit 1
  }
  echo "✅ Renamed libquery_engine.so to libquery_engine.so.node"
else
  echo "❌ File libquery_engine.so not found in $TEMP_DIR."
  exit 1
fi

# Utwórz folder docelowy dla Prisma Client
mkdir -p "$LOCAL_PRISMA_DIR"
echo "✅ Created directory $LOCAL_PRISMA_DIR"

# Skopiuj binarkę do folderu node_modules/.prisma/client
cp "$TEMP_DIR/libquery_engine.so.node" "$LOCAL_PRISMA_DIR/libquery_engine-freebsd14.so.node" || {
  echo "❌ Failed to copy libquery_engine.so.node to $LOCAL_PRISMA_DIR/libquery_engine-freebsd14.so.node."
  exit 1
}
echo "✅ Copied libquery_engine.so.node to $LOCAL_PRISMA_DIR/libquery_engine-freebsd14.so.node"

# Ustaw uprawnienia
chmod 755 "$LOCAL_PRISMA_DIR/libquery_engine-freebsd14.so.node" || {
  echo "❌ Failed to set permissions for $LOCAL_PRISMA_DIR/libquery_engine-freebsd14.so.node."
  exit 1
}
echo "✅ Set permissions for $LOCAL_PRISMA_DIR/libquery_engine-freebsd14.so.node"

# Wyczyść tymczasowe pliki
rm -rf "$TEMP_DIR"
echo "✅ Cleaned up temporary directory $TEMP_DIR"

echo "✅ Prisma engine for FreeBSD 14 successfully placed in $LOCAL_PRISMA_DIR/libquery_engine-freebsd14.so.node"