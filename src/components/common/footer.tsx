import * as styles from "./footer.module.css";

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.contents}>
        <p>
          もしよろしければ <a href="https://patron.ojisan.io">お財布のご支援</a>{" "}
          をお願いします。
        </p>
        <p>
          ソースコードは
          <a href="https://github.com/sadnessOjisan/blog.ojisan.io">こちら</a>
          です。
        </p>
        <p>
          このサイトは
          <a href="https://www.gatsbyjs.com/">Gatsby</a>
          で作られています。
        </p>
      </div>
    </footer>
  );
};
