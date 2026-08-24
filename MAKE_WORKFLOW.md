# Make.com workflow

## Goal

`Send details` posts patient profile plus screening history to Make. Make emails report and sends UniSMS notification. Delivery stays manual.

## Payload

```json
{
  "patient": {
    "id": "pat_...",
    "fullName": "...",
    "dateOfBirth": "YYYY-MM-DD",
    "sex": "...",
    "email": "...",
    "mobileNumber": "..."
  },
  "history": [
    {
      "id": "scr_...",
      "status": "completed",
      "startedAt": "ISO timestamp",
      "completedAt": "ISO timestamp",
      "heartRate": 72,
      "spo2": 98,
      "signalQuality": "verified"
    }
  ],
  "sentAt": "ISO timestamp",
  "source": "HemoSync local station"
}
```

## Setup: Make.com

1. Make → **Create new scenario**.
2. Add **Webhooks → Custom webhook**.
3. Click **Add**, name it `HemoSync patient details`, then copy webhook URL.
4. Click **Run once**. Leave Make waiting for sample data.
5. Configure HemoSync with webhook URL using steps in **Connect HemoSync**.
6. Restart HemoSync. Open any patient history. Click **Send details** once.
7. Return to Make. Webhook now knows HemoSync fields.

## Setup: email report

1. Click plus after webhook.
2. Add **Gmail → Send an email** or **Microsoft 365 Email → Send an email**.
3. Connect clinic email account.
4. Set **To** to webhook field `patient → email`.
5. Set **Subject** to `HemoSync screening report`.
6. Enable **HTML** content/body in email module. HemoSync sends `history` newest-first, so map **first history item** for latest result. Set **Content** to this template:

   ```html
   <div style="margin:0;padding:32px 16px;background:#08090c;font-family:Arial,sans-serif;color:#f8fafc;">
     <div style="max-width:640px;margin:auto;overflow:hidden;border:1px solid #30202a;border-radius:20px;background:#111217;">
       <div style="padding:28px 32px;background:linear-gradient(135deg,#25060d,#120d12);border-bottom:1px solid #4a1c29;">
         <div style="font-size:12px;font-weight:bold;letter-spacing:3px;color:#fca5a5;">HEMOSYNC</div>
         <h1 style="margin:12px 0 0;font-size:27px;color:#ffffff;">Screening report</h1>
         <p style="margin:8px 0 0;color:#b7aab0;font-size:14px;">Private local screening summary</p>
       </div>
       <div style="padding:28px 32px;">
         <p style="margin:0 0 4px;color:#8f8389;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;">Patient</p>
         <p style="margin:0;font-size:22px;font-weight:bold;color:#ffffff;">[MAP: patient → fullName]</p>
         <p style="margin:6px 0 24px;color:#b7aab0;font-size:14px;">Date of birth: [MAP: patient → dateOfBirth] · Completed: [MAP: history → first item → completedAt]</p>
         <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;border-collapse:separate;border-spacing:10px 0;">
           <tr>
             <td width="50%" style="padding:20px;border:1px solid #513440;border-radius:14px;background:#180f14;">
               <div style="color:#b7aab0;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Heart rate</div>
               <div style="margin-top:8px;color:#ffffff;font-size:30px;font-weight:bold;">[MAP: history → first item → heartRate] <span style="font-size:13px;color:#d1c4c9;">BPM</span></div>
             </td>
             <td width="50%" style="padding:20px;border:1px solid #513440;border-radius:14px;background:#180f14;">
               <div style="color:#b7aab0;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Blood oxygen</div>
               <div style="margin-top:8px;color:#ffffff;font-size:30px;font-weight:bold;">[MAP: history → first item → spo2]<span style="font-size:16px;color:#d1c4c9;">%</span></div>
             </td>
           </tr>
         </table>
         <div style="padding:20px;border-left:3px solid #ef4444;border-radius:8px;background:#1a1115;">
           <p style="margin:0 0 8px;color:#fca5a5;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Screening guidance</p>
           <p style="margin:0;color:#eee7e9;font-size:15px;line-height:1.6;">[MAP: history → first item → assessmentSummary]</p>
         </div>
         <div style="margin-top:20px;padding:20px;border:1px solid #302a2e;border-radius:12px;">
           <p style="margin:0 0 8px;color:#d1c4c9;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Suggested next steps</p>
           <p style="margin:0;color:#d1c4c9;font-size:14px;line-height:1.6;">[MAP: history → first item → assessmentSuggestions]</p>
         </div>
         <p style="margin:24px 0 0;color:#8f8389;font-size:12px;line-height:1.6;">This is screening guidance, not a diagnosis. Discuss concerns with a qualified clinician.</p>
       </div>
       <div style="padding:18px 32px;background:#0b0c10;border-top:1px solid #29242a;color:#756b70;font-size:11px;">HemoSync · Local clinical screening · Private by design</div>
     </div>
   </div>
   ```

7. Replace each `[MAP: ...]` text by clicking Make mapper fields below. Do not type literal `[MAP: ...]` text.

| Template location | Click this Make webhook field |
| --- | --- |
| Patient name | `patient` → `fullName` |
| Date of birth | `patient` → `dateOfBirth` |
| Completed | `history` → first array item → `completedAt` |
| Heart rate | `history` → first array item → `heartRate` |
| Blood oxygen | `history` → first array item → `spo2` |
| Guidance | `history` → first array item → `assessmentSummary` |
| Suggestions | `history` → first array item → `assessmentSuggestions` |

`history` is an array. If Make only shows **Array** instead of individual fields, click its mapping button, select first item (`1`), then select requested field. Do not add Iterator: one email must use newest screening only.

## Setup: UniSMS notification

1. Click plus after email module.
2. Add **HTTP → Make a request**. UniSMS does not need a separate Make app.
3. Copy request method, URL, authorization, headers, and body field names from your UniSMS API documentation/account dashboard.
4. Add webhook field `patient → mobileNumber` as recipient.
5. Set message body:

   ```text
   HemoSync: Your screening report has been sent to your email. Contact your clinic for questions.
   ```

6. Store UniSMS API key only inside Make HTTP authorization/header fields. Never put it in HemoSync files or browser code.
7. SMS recipient must use format required by UniSMS. Use test number first.

## Test and enable

1. Click **Run once** in Make.
2. In HemoSync patient history, click **Send details**.
3. Confirm email received and UniSMS request succeeds.
4. Turn scenario **ON**.

## Connect HemoSync

1. Copy `web/.env.local.example` to `web/.env.local`.
2. Replace `MAKE_WEBHOOK_URL` value with copied Make webhook URL.
3. Close and restart HemoSync using `Start-HemoSync.bat`.
4. Open patient history. Click **Send details**.

Never commit `web/.env.local`. Webhook URL stays server-side; browser never receives it.

## Required Make connections

- Gmail or Microsoft 365 Outlook account used to send reports.
- UniSMS API account and API key.
- Groq API key for assessment and spoken report audio.
- Patient email and mobile number must be present.

## Privacy

- Email contains report values; use a clinic-controlled mailbox and obtain consent.
- SMS confirms email delivery only. Do not put heart rate, SpO₂, diagnosis, or other health data in SMS.
- Want automatic sends after capture: add only after clinical approval; manual send protects against unintended disclosure.
