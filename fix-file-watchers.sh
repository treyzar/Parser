#!/bin/bash
# Скрипт для увеличения лимита file watchers в Linux

echo "Текущий лимит file watchers: $(cat /proc/sys/fs/inotify/max_user_watches)"

# Временное увеличение (до перезагрузки)
echo "Увеличиваю лимит до 524288..."
sudo sysctl -w fs.inotify.max_user_watches=524288

# Постоянное увеличение (после перезагрузки)
echo "Добавляю постоянное значение в /etc/sysctl.conf..."
if ! grep -q "fs.inotify.max_user_watches" /etc/sysctl.conf; then
    echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
    echo "✓ Значение добавлено в /etc/sysctl.conf"
else
    echo "⚠ Значение уже существует в /etc/sysctl.conf"
    echo "Проверьте файл и обновите значение вручную, если нужно"
fi

echo ""
echo "Новый лимит: $(cat /proc/sys/fs/inotify/max_user_watches)"
echo "✓ Готово! Теперь можно перезапустить Vite dev server."
