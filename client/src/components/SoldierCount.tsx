import Helmet from "./Helmet";
import "./SoldierCount.css";

type SoldierCountProps = {
  count: number;
};

function SoldierCount({ count }: SoldierCountProps) {
  return (
    <span className="soldier-count" title={`${count} soldiers`}>
      <Helmet />
      <b>{count}</b>
    </span>
  );
}

export default SoldierCount;
