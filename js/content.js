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
    },
    {
      id: "kot-2026",
      date: "25 июля 2026",
      type: "СЕМЕЙНОЕ СОБЫТИЕ",
      title: "Аня, Игорь и кошечка",
      summary: "Семья Барановых заели милую кошечку",
      folder: "images/events/ko",
      maxPhotos: 40
    }

    // НОВОЕ СОБЫТИЕ ДОБАВЛЯЕТСЯ СЮДА.
    // Скопируйте блок выше, вставьте через запятую и поменяйте id, дату, название,
    // описание и папку. Например папка: images/events/family-evening-2026
  ],

  birthdays: [
    { name: "Владимир", date: "19 апреля" },
    { name: "Ольга", date: "27 июля" },
    { name: "Ася", date: "30 апреля" },
    { name: "Маша", date: "25 июня" },
    { name: "Федя", date: "8 марта" },
    { name: "Ксюша", date: "11 июля" },
    { name: "Андрей", date: "7 марта" },
    { name: "Миша", date: "27 июля" },
    { name: "Даша", date: "14 июля" },
    { name: "Татьяна", date: "23 нобря" },
    { name: "Игорь", date: "20 марта" },
    { name: "Аня", date: "4 февраля" },
    { name: "Соня", date: "6 сентября" },
    { name: "Дима", date: "10 апреля" },
    { name: "Алина", date: "17 апреля" },
    { name: "Майя", date: "17 апреля" },
    { name: "София", date: "14 февраля" },
    { name: "Мия", date: "20 сентября" }
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
