import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useItems } from '../context/ItemsContext';
import Card from '../components/ui/Card';
import FilterableList from '../components/ui/FilterableList';
import styles from '../styles/mixedDashboard.module.css';

const ROUTES = [
  { to: '/tasks', title: 'Tasks', hint: 'Track work, priorities and deadlines.' },
  { to: '/recipes', title: 'Recipes', hint: 'Collect recipes and kitchen notes.' },
  { to: '/movies', title: 'Movies', hint: 'Build a film gallery and watchlist.' },
];

function HomePage() {
  const { tasks, recipes, movies } = useItems();

  const metrics = useMemo(() => [
    { label: 'Tasks', value: tasks.length },
    { label: 'Recipes', value: recipes.length },
    { label: 'Movies', value: movies.length },
  ], [movies.length, recipes.length, tasks.length]);

  const latestItems = useMemo(() => [
    ...tasks.slice(0, 2).map((item) => ({ ...item, kind: 'Task' })),
    ...recipes.slice(0, 2).map((item) => ({ ...item, kind: 'Recipe' })),
    ...movies.slice(0, 2).map((item) => ({ ...item, kind: 'Movie' })),
  ].slice(0, 5), [movies, recipes, tasks]);

  return (
    <div className={styles.pageSection}>
      <section className={styles.hero}>
        <div>
          <p className={styles.heroKicker}>Mixed Dashboard</p>
          <h2 className={styles.heroTitle}>Task tracker, recipe book and movie gallery in one workspace.</h2>
          <p className={styles.sectionLead}>
            Build a single, polished dashboard for university lab work with CRUD, filters, modal forms and notifications.
          </p>
        </div>

        <div className={styles.heroActions}>
          {ROUTES.map((route) => (
            <Link key={route.to} to={route.to} className={styles.primaryButton}>
              {route.title}
            </Link>
          ))}
        </div>
      </section>

      <div className={styles.statsGrid}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.statCard}>
            <span className={styles.statLabel}>{metric.label}</span>
            <strong className={styles.statValue}>{metric.value}</strong>
          </div>
        ))}
      </div>

      <section className={styles.pageSection}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.heroKicker}>Quick start</p>
            <h3 className={styles.sectionTitle}>Jump into one of the collections</h3>
          </div>
        </header>

        <div className={styles.featureGrid}>
          {ROUTES.map((route) => (
            <Link key={route.to} to={route.to} className={styles.featureCard}>
              <h4>{route.title}</h4>
              <p>{route.hint}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.pageSection}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.heroKicker}>Recent</p>
            <h3 className={styles.sectionTitle}>Latest items from every area</h3>
          </div>
        </header>

        <FilterableList
          items={latestItems}
          renderItem={(item) => (
            <Card key={`${item.kind}-${item.id}`} item={item} className={styles.compactCard}>
              <Card.Header badge={item.kind} />
              <Card.Body />
              <Card.Footer>
                <span className={styles.cardMeta}>{item.kind}</span>
              </Card.Footer>
            </Card>
          )}
        />
      </section>
    </div>
  );
}

export default HomePage;

