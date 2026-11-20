import { t } from "@/app/frontend_admin/admin_management/management_barcodes/utils/AdminManagementBarcodesMessages";
import { encodeLabel } from "@/app/frontend_admin/admin_management/management_barcodes/utils/AdminManagementBarcodesEncoding";
export function AdminManagementBarcodesLabel({ sku, name }: { sku: string; name: string }) {
  const code = encodeLabel(sku);
  if (!code) return <p>{t("message13")}</p>;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={sku}
      viewBox={`0 0 ${code.width} 100`}
      width="340"
      height="110"
      className="max-w-full"
    >
      <title>
        {name} · {sku}
      </title>
      <rect width={code.width} height={100} fill="white" />
      {code.bars.map((r, i) => (
        <rect key={i} x={r.x} y={10} width={r.width} height={60} fill="black" />
      ))}
      <text x={code.width / 2} y={86} textAnchor="middle" fontSize={12} fill="black">
        {code.text}
      </text>
    </svg>
  );
}
