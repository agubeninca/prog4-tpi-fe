import { Result, Button } from 'antd';
import { Link } from 'react-router';

export function NotFoundView() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="La página que buscás no existe."
      extra={
        <Link to="/">
          <Button type="primary">Volver al inicio</Button>
        </Link>
      }
    />
  );
}
