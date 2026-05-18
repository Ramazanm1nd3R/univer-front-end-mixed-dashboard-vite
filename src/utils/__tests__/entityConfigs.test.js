/* eslint-env vitest */
import { ENTITY_CONFIGS, getEntityConfig } from '../entityConfigs';

describe('entityConfigs validators', () => {
  describe('tasks', () => {
    const { validate } = ENTITY_CONFIGS.tasks;

    it('rejects short titles when touched', () => {
      const errors = validate({ title: 'a', description: '', dueDate: '' }, { title: true });
      expect(errors.title).toBeDefined();
    });

    it('accepts valid titles', () => {
      const errors = validate({ title: 'Valid title', description: 'Long enough description', dueDate: '' }, {
        title: true,
        description: true,
      });
      expect(errors.title).toBeUndefined();
    });
  });

  describe('recipes', () => {
    const { validate } = ENTITY_CONFIGS.recipes;

    it('cross-field: rejects when prepTime + cookTime <= 0', () => {
      const errors = validate(
        { title: 'Soup', description: 'A good soup recipe', prepTime: 0, cookTime: 0, servings: 1 },
        { prepTime: true, cookTime: true },
      );
      expect(errors.cookTime).toBeDefined();
    });

    it('cross-field: passes when total time is positive', () => {
      const errors = validate(
        { title: 'Soup', description: 'A good soup recipe', prepTime: 10, cookTime: 5, servings: 2 },
        { prepTime: true, cookTime: true },
      );
      expect(errors.cookTime).toBeUndefined();
    });
  });

  describe('movies', () => {
    const { validate } = ENTITY_CONFIGS.movies;

    it('cross-field: rejects watched movie with no rating', () => {
      const errors = validate(
        { title: 'Movie', status: 'watched', rating: 0, year: 2024 },
        { status: true, rating: true },
      );
      expect(errors.rating).toBeDefined();
    });

    it('cross-field: accepts watched movie with rating', () => {
      const errors = validate(
        { title: 'Movie', status: 'watched', rating: 4, year: 2024 },
        { status: true, rating: true },
      );
      expect(errors.rating).toBeUndefined();
    });

    it('cross-field: allows watchlist movies without rating', () => {
      const errors = validate(
        { title: 'Movie', status: 'watchlist', rating: 0, year: 2024 },
        { status: true, rating: true },
      );
      expect(errors.rating).toBeUndefined();
    });
  });

  it('getEntityConfig returns the right config', () => {
    expect(getEntityConfig('tasks')).toBe(ENTITY_CONFIGS.tasks);
    expect(getEntityConfig('recipes')).toBe(ENTITY_CONFIGS.recipes);
    expect(getEntityConfig('movies')).toBe(ENTITY_CONFIGS.movies);
  });
});
