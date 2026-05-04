export default function Inventory({ items }) {
  if (!items.length) return null;

  return (
    <div className="inventory-bar">
      <span className="inventory-label">Collected</span>
      {items.map((item, i) => (
        <div key={i} className="inventory-item">
          <span className="inventory-item-icon">{item.icon}</span>
          <span className="inventory-item-name">{item.name}</span>
        </div>
      ))}
    </div>
  );
}