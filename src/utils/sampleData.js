/**
 * Synthetic sample payloads for live demonstration and testing.
 * None of these values represent real individuals or issued credentials.
 */
export const SAMPLE_DOCUMENTS = [
  {
    id: 'support-ticket',
    label: 'Support Ticket (TXT)',
    fileType: 'txt',
    fileName: 'synthetic_support_ticket.txt',
    content: `[TICKET #PW-4082] Escalation - Billing & KYC Verification
Reported by: aarav.mehta@example.com
Backup contact: aarav.mehta@example.com | Priya Nair <priya.nair@sampleorg.in>
Primary phone: +91 98765 43210
Secondary phone: 9876543210 | Office: +91-22-26543210
Client IP: 192.168.14.28 (Rejected invalid octet log: 192.168.1.999)
Synthetic PAN: ABCDE1234F
Synthetic Aadhaar: 2345 6789 0123
Synthetic Test Card (Luhn valid): 4532-1234-5678-9014
Non-card Order Reference (fails Luhn): 4532-1234-5678-9010

Notes: Please reach back out to aarav.mehta@example.com before 18:00 IST.`,
  },
  {
    id: 'customer-csv',
    label: 'Customer Export (CSV)',
    fileType: 'csv',
    fileName: 'synthetic_customers.csv',
    content: `record_id,full_name,contact_email,phone,kyc_notes,ipv4,card_ref
101,"Mehta, Aarav",aarav.mehta@example.com,+91-9876543210,"PAN: ABCDE1234F
Aadhaar: 2345-6789-0123",10.24.18.5,4242-4242-4242-4242
102,"Nair, Priya",priya.nair@sampleorg.in,9820098200,"Escalated to aarav.mehta@example.com
Alt Phone: (555) 234-5678",172.16.40.12,4532-1234-5678-9014
103,"Rao, Kabir",kabir.rao@testmail.org,9123456780,"No card on file; ref 1234567890123456",203.0.113.45,N/A`,
  },
];
