type User = {
  name: string;
  email: string;
  employee_id?: number;
  dob?: string;
  address?: string;
  phone_no?: string;
  id_type?: string;
  id_number?: string;
  designation_id?: number;
  year_joined?: string;
  salary?: number;
};

type Props = {
  user: User;
};

function row(label: string, value?: string | number) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          color: '#0f172a',
          fontWeight: 500,
          padding: '6px 8px',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          background: '#f9fafb',
        }}
      >
        {value ?? 'Not set'}
      </span>
    </div>
  );
}

function MeView({ user }: Props) {
  return (
    <div style={{ maxWidth: 520 }}>
      <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>Profile</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
          gap: 12,
        }}
      >
        {row('Employee ID', user.employee_id)}
        {row('Name', user.name)}
        {row('Email', user.email)}
        {row('Date of birth', user.dob)}
        {row('Phone number', user.phone_no)}
        {row('ID type', user.id_type)}
        {row('ID number', user.id_number)}
        {row('Designation ID', user.designation_id)}
        {row('Year joined', user.year_joined)}
        {row('Address', user.address)}
        {row('Salary', user.salary)}
      </div>
    </div>
  );
}

export default MeView;
