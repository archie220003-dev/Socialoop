import { ShieldCheck } from 'lucide-react';

const AdminBadge = ({ showText = true, style = {} }) => {
  return (
    <span className="admin-badge" style={style}>
      <ShieldCheck size={12} fill="currentColor" opacity="0.8" />
      {showText && <span>Admin</span>}
    </span>
  );
};

export default AdminBadge;
