// Конфиги для трёх сущностей дашборда: задачи, рецепты, фильмы.
// Идея — единый формат entityConfig, чтобы EntityBoard и EntityFormModal
// могли работать с любой сущностью без знания о её специфике.
// Каждый config описывает:
//   label/singular/description/empty* — UI-тексты
//   sortOptions, filterFields           — что показывать в шапке доски
//   initialValues, fields               — схема формы создания/редактирования
//   validate(values, touched)           — правила, в том числе cross-field
//   buildPayload/normalizeItem          — преобразования "форма ↔ модель"
//
// Когда добавляется новая сущность (например, Books) — нужно только
// дописать config сюда, никакой код в widgets/EntityBoard трогать не нужно.

const taskCategories = [
  { value: 'design', label: 'Design' },
  { value: 'planning', label: 'Planning' },
  { value: 'development', label: 'Development' },
  { value: 'study', label: 'Study' },
];

const recipeCuisines = [
  { value: 'Mediterranean', label: 'Mediterranean' },
  { value: 'Asian', label: 'Asian' },
  { value: 'Breakfast', label: 'Breakfast' },
  { value: 'Dessert', label: 'Dessert' },
];

const movieGenres = [
  { value: 'Sci-Fi', label: 'Sci-Fi' },
  { value: 'Drama', label: 'Drama' },
  { value: 'Comedy', label: 'Comedy' },
  { value: 'Romance', label: 'Romance' },
  { value: 'Documentary', label: 'Documentary' },
];

export const ENTITY_CONFIGS = {
  tasks: {
    label: 'Tasks',
    singularLabel: 'Task',
    description: 'Track priorities, deadlines and day-to-day work.',
    emptyTitle: 'No tasks yet',
    emptyText: 'Create a task to start filling the workspace.',
    sortOptions: [
      { value: 'updatedAt', label: 'Recent' },
      { value: 'title', label: 'Title' },
      { value: 'priority', label: 'Priority' },
    ],
    filterFields: {
      category: [
        { value: 'all', label: 'All categories' },
        ...taskCategories,
      ],
      status: [
        { value: 'all', label: 'All status' },
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    initialValues: {
      title: '',
      description: '',
      category: 'design',
      status: 'active',
      priority: 'medium',
      dueDate: '',
    },
    getInitialRefValue(item) {
      return item?.notes || '';
    },
    buildPayload(values, refValue) {
      return {
        ...values,
        notes: refValue || '',
      };
    },
    normalizeItem(item) {
      return {
        ...item,
        notes: item.notes || '',
      };
    },
    validate(values, touched = {}) {
      const errors = {};

      if (touched.title && values.title.trim().length < 3) {
        errors.title = 'Task title should be at least 3 characters';
      }

      if (touched.description && values.description.trim().length < 8) {
        errors.description = 'Add a bit more detail';
      }

      if (touched.dueDate && values.dueDate && Number.isNaN(new Date(values.dueDate).getTime())) {
        errors.dueDate = 'Enter a valid date';
      }

      return errors;
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', placeholder: 'Plan the sprint board' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Describe the task in one or two sentences' },
      { name: 'category', label: 'Category', type: 'select', options: taskCategories },
      { name: 'priority', label: 'Priority', type: 'select', options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ] },
      { name: 'status', label: 'Status', type: 'select', options: [
        { value: 'active', label: 'Active' },
        { value: 'completed', label: 'Completed' },
      ] },
      { name: 'dueDate', label: 'Due date', type: 'date' },
    ],
    refField: { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Optional details, reminders or context.' },
  },
  recipes: {
    label: 'Recipes',
    singularLabel: 'Recipe',
    description: 'Collect meal ideas, ingredients and prep plans.',
    emptyTitle: 'No recipes yet',
    emptyText: 'Add a recipe to keep your kitchen ideas in one place.',
    sortOptions: [
      { value: 'updatedAt', label: 'Recent' },
      { value: 'title', label: 'Title' },
      { value: 'prepTime', label: 'Fastest prep' },
      { value: 'rating', label: 'Rating' },
    ],
    filterFields: {
      cuisine: [
        { value: 'all', label: 'All cuisines' },
        ...recipeCuisines,
      ],
      difficulty: [
        { value: 'all', label: 'All levels' },
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' },
      ],
      status: [
        { value: 'all', label: 'All status' },
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
      ],
    },
    initialValues: {
      title: '',
      description: '',
      cuisine: 'Mediterranean',
      difficulty: 'easy',
      status: 'draft',
      prepTime: 15,
      cookTime: 10,
      servings: 2,
    },
    getInitialRefValue(item) {
      return item?.notes || '';
    },
    buildPayload(values, refValue) {
      return {
        ...values,
        prepTime: Number(values.prepTime),
        cookTime: Number(values.cookTime),
        servings: Number(values.servings),
        notes: refValue || '',
      };
    },
    normalizeItem(item) {
      return {
        ...item,
        prepTime: Number(item.prepTime) || 0,
        cookTime: Number(item.cookTime) || 0,
        servings: Number(item.servings) || 1,
        notes: item.notes || '',
      };
    },
    validate(values, touched = {}) {
      const errors = {};

      if (touched.title && values.title.trim().length < 3) {
        errors.title = 'Recipe title should be at least 3 characters';
      }

      if (touched.description && values.description.trim().length < 10) {
        errors.description = 'Describe the recipe a little more';
      }

      if (touched.prepTime && Number(values.prepTime) < 1) {
        errors.prepTime = 'Prep time must be at least 1 minute';
      }

      if (touched.servings && Number(values.servings) < 1) {
        errors.servings = 'Servings must be at least 1';
      }

      // Cross-field правило: суммарное время приготовления должно быть > 0.
      // Сначала пользователь мог написать prepTime=10, потом стереть cookTime —
      // по отдельности оба поля валидны, но сумма получилась бы 0. Ловим именно это.
      if ((touched.prepTime || touched.cookTime) && Number(values.prepTime) + Number(values.cookTime) <= 0) {
        errors.cookTime = 'Total prep + cook time should be at least 1 minute';
      }

      return errors;
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', placeholder: 'Berry overnight oats' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Short description for the recipe card' },
      { name: 'cuisine', label: 'Cuisine', type: 'select', options: recipeCuisines },
      { name: 'difficulty', label: 'Difficulty', type: 'select', options: [
        { value: 'easy', label: 'Easy' },
        { value: 'medium', label: 'Medium' },
        { value: 'hard', label: 'Hard' },
      ] },
      { name: 'status', label: 'Status', type: 'select', options: [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
      ] },
      { name: 'prepTime', label: 'Prep time (minutes)', type: 'number', min: 1 },
      { name: 'cookTime', label: 'Cook time (minutes)', type: 'number', min: 0 },
      { name: 'servings', label: 'Servings', type: 'number', min: 1 },
    ],
    refField: { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Ingredient swaps, serving ideas or storage notes.' },
  },
  movies: {
    label: 'Movies',
    singularLabel: 'Movie',
    description: 'Collect films, ratings and watchlist ideas.',
    emptyTitle: 'No movies yet',
    emptyText: 'Add a movie so the gallery feels alive.',
    sortOptions: [
      { value: 'updatedAt', label: 'Recent' },
      { value: 'title', label: 'Title' },
      { value: 'rating', label: 'Rating' },
      { value: 'year', label: 'Year' },
    ],
    filterFields: {
      genre: [
        { value: 'all', label: 'All genres' },
        ...movieGenres,
      ],
      status: [
        { value: 'all', label: 'All status' },
        { value: 'watchlist', label: 'Watchlist' },
        { value: 'watched', label: 'Watched' },
      ],
    },
    initialValues: {
      title: '',
      description: '',
      genre: 'Sci-Fi',
      status: 'watchlist',
      rating: 4,
      year: new Date().getFullYear(),
      director: '',
      posterUrl: '',
    },
    getInitialRefValue(item) {
      return item?.notes || '';
    },
    buildPayload(values, refValue) {
      return {
        ...values,
        rating: Number(values.rating),
        year: Number(values.year),
        notes: refValue || '',
      };
    },
    normalizeItem(item) {
      return {
        ...item,
        rating: Number(item.rating) || 0,
        year: Number(item.year) || new Date().getFullYear(),
        notes: item.notes || '',
      };
    },
    validate(values, touched = {}) {
      const errors = {};

      if (touched.title && values.title.trim().length < 2) {
        errors.title = 'Movie title should be at least 2 characters';
      }

      if (touched.rating) {
        const rating = Number(values.rating);
        if (Number.isNaN(rating) || rating < 0 || rating > 5) {
          errors.rating = 'Rating should be between 0 and 5';
        }
      }

      if (touched.year) {
        const year = Number(values.year);
        if (Number.isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
          errors.year = 'Enter a realistic release year';
        }
      }

      // Cross-field: если фильм помечен как "просмотрен" — рейтинг обязателен.
      // Логично: ты же его уже посмотрел, значит можешь поставить оценку.
      // Запускаем правило когда трогали хотя бы одно из связанных полей.
      if ((touched.status || touched.rating) && values.status === 'watched' && Number(values.rating) <= 0) {
        errors.rating = 'Add a rating for a watched movie';
      }

      return errors;
    },
    fields: [
      { name: 'title', label: 'Title', type: 'text', placeholder: 'Arrival' },
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Short pitch for the movie card' },
      { name: 'genre', label: 'Genre', type: 'select', options: movieGenres },
      { name: 'status', label: 'Status', type: 'select', options: [
        { value: 'watchlist', label: 'Watchlist' },
        { value: 'watched', label: 'Watched' },
      ] },
      { name: 'rating', label: 'Rating', type: 'number', min: 0, max: 5, step: 0.1 },
      { name: 'year', label: 'Year', type: 'number', min: 1900, max: new Date().getFullYear() + 1 },
      { name: 'director', label: 'Director', type: 'text', placeholder: 'Denis Villeneuve' },
      { name: 'posterUrl', label: 'Poster URL', type: 'text', placeholder: 'https://...' },
    ],
    refField: { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Why this film matters to you or what to watch next.' },
  },
};

export function getEntityConfig(type) {
  return ENTITY_CONFIGS[type];
}

