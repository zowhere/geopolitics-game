import "./SoldierCount.css";

type SoldierCountProps = {
  count: number;
};

function SoldierCount({ count }: SoldierCountProps) {
  return (
    <span className="soldier-count" title={`${count} soldiers`}>
      <svg viewBox="0 0 26 18" aria-hidden="true">
        <path
          className="soldier-count-helmet"
          d="M3 13.5C3 6.5 7.5 2 13 2s10 4.5 10 11.5z"
        />
        <rect className="soldier-count-brim" x="0.5" y="12.5" width="25" height="3.5" rx="1.75" />
      </svg>
      <b>{count}</b>
    </span>
  );
}

export default SoldierCount;
