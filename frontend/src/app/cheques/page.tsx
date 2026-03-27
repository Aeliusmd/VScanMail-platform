import { cheques } from "@/mocks/cheques";
import styles from "./page.module.css";

export default function ChequesPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1 className={styles.title}>Cheques</h1>
          <p className={styles.subtitle}>All cheque records in one place</p>
        </header>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Cheques</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {cheques.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className={styles.companyCell}>
                      <span className={styles.companyInitial}>{item.companyInitial}</span>
                      <span>{item.company}</span>
                    </div>
                  </td>
                  <td>{item.contact}</td>
                  <td>{item.email}</td>
                  <td>{item.cheques}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        item.status === "Active"
                          ? styles.active
                          : item.status === "Pending"
                            ? styles.pending
                            : styles.inactive
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
