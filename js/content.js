// =====================================================
// СЕМЕЙНЫЙ КОНТЕНТ — ЭТОТ ФАЙЛ МОЖНО РЕДАКТИРОВАТЬ
// =====================================================
// Фото внутри события или альбома называйте по порядку:
// 01.jpg, 02.jpg, 03.jpg ...
// Можно также использовать .png или .webp — сайт попробует найти их сам.

window.FAMILY_CONTENT = {
  events: [
    {
      id: "wedding-2026",
      date: "26 апреля 2026",
      type: "СЕМЕЙНОЕ СОБЫТИЕ",
      title: "Наша свадьба 💍",
      summary: "Один из тех дней, которые хочется сохранить целиком — вместе с фотографиями, эмоциями и всеми, кто был рядом.",
      folder: "images/events/wedding-2026",
      maxPhotos: 40
    }

    // НОВОЕ СОБЫТИЕ ДОБАВЛЯЕТСЯ СЮДА.
    // Скопируйте блок выше, вставьте через запятую и поменяйте id, дату, название,
    // описание и папку. Например папка: images/events/family-evening-2026
  ],

  birthdays: [
    { name: "Владимир", date: "—" },
    { name: "Ольга", date: "—" },
    { name: "Ася", date: "—" },
    { name: "Маша", date: "—" },
    { name: "Федя", date: "—" },
    { name: "Ксюша", date: "—" },
    { name: "Андрей", date: "—" },
    { name: "Миша", date: "—" },
    { name: "Даша", date: "—" },
    { name: "Татьяна", date: "—" },
    { name: "Игорь", date: "—" },
    { name: "Аня", date: "—" },
    { name: "Соня", date: "—" },
    { name: "Дима", date: "—" },
    { name: "Алина", date: "—" },
    { name: "Майя", date: "—" },
    { name: "София", date: "—" },
    { name: "Мия", date: "—" }
  ],

  albums: [
    { id: "celebrations", number: "01", title: "Семейные праздники", subtitle: "Дни, когда все собрались вместе", folder: "images/gallery/celebrations", maxPhotos: 60 },
    { id: "travel", number: "02", title: "Путешествия", subtitle: "Города, дороги и совместные приключения", folder: "images/gallery/travel", maxPhotos: 60 },
    { id: "just-us", number: "03", title: "Просто мы", subtitle: "Обычные дни, которые потом становятся важными", folder: "images/gallery/just-us", maxPhotos: 60 },
    { id: "childhood", number: "04", title: "Детство", subtitle: "Старые фотографии и семейный архив", folder: "images/gallery/childhood", maxPhotos: 60 },
    { id: "memories", number: "05", title: "Новые воспоминания", subtitle: "То, что происходит прямо сейчас", folder: "images/gallery/memories", maxPhotos: 60 },
    { id: "archive", number: "06", title: "Архив", subtitle: "Всё, чему пока не придумали отдельный альбом", folder: "images/gallery/archive", maxPhotos: 60 }
  ]
};
