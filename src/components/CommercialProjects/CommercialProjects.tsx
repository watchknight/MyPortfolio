import { useState } from 'react';
import { projects, type ProjectData } from '../../data/projects';
import { CaseStudyModal } from '../CaseStudyModal/CaseStudyModal';
import styles from './CommercialProjects.module.css';

export function CommercialProjects() {
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  const commercialWorks = projects.filter((p) =>
    ['doclensbd', 'poshra'].includes(p.id)
  );

  return (
    <>
      <section className={styles.section} id="interfaces">
        <div className="container">
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Product & Interface Engineering
            </h2>
            <p className={styles.sectionIntro}>
              Full-stack and computer-vision applications built for responsive layout
              stability, real-time client perception, and verified regional commerce transactions.
            </p>
          </header>

          <div className={styles.grid}>
            {commercialWorks.map((project) => (
              <article key={project.id} className={styles.card} id={project.id}>
                <h3 className={styles.cardTitle}>{project.title}</h3>
                <p className={styles.cardSubtitle}>{project.subtitle}</p>
                <p className={styles.cardDescription}>{project.problem}</p>
                
                <div className={styles.envTags}>
                  {project.environment.map((env) => (
                    <span key={env} className={styles.envTag}>{env}</span>
                  ))}
                </div>

                <div className={styles.cardActions}>
                  <a
                    href={project.repository}
                    className={styles.cardAction}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Inspect repository on GitHub
                  </a>
                  <button
                    type="button"
                    className={styles.cardAction}
                    onClick={() => setSelectedProject(project)}
                  >
                    Examine case study
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CaseStudyModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </>
  );
}
