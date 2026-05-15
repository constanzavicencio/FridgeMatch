import styles from "./Card.module.css";

type CardProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function Card({ children, className, style }: CardProps) {
  return <div className={`${styles.card} ${className ?? ""}`.trim()} style={style}>{children}</div>;
}