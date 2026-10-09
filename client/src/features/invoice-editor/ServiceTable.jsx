import ProductTable from './ProductTable';
// Same table, but for services (no stock)
export default function ServiceTable(props) {
  return <ProductTable kind="service" {...props} />;
}
