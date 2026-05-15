import styles from "./Button.module.css";

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Button({ children, className }: ButtonProps) {
  return <button className={`${styles.btn} ${className ?? ""}`.trim()}>{children}</button>;
}