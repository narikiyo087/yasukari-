import Head from 'next/head'

export default function TermsPageEn() {
  const items = [
    'Insurance benefits are paid within the limits below.\n\nNote: Any damages exceeding the deductible or insurance payment are the responsibility of the contract holder. Insurance benefits are not payable if the accident falls under exclusion clauses or if there is no police accident report.\n\nBodily injury: Unlimited per person (including compulsory liability insurance)\n\nProperty damage: Up to ¥10,000,000 per accident (deductible ¥50,000)\n\nPassenger injury: Up to ¥5,000,000 per person (death or permanent disability only), excluding mopeds (up to 125cc)\n\nVehicle damage: Up to the market value or the amount defined by our compensation system\n\nTheft: Up to the amount defined by our compensation system (theft without removing the key or locking the handle is excluded).',
    'You must carry this certificate while operating the vehicle and present it to police, transport bureau, or land transport office officials upon request.',
    'In the event of an accident, promptly notify the police, our store, and the insurance company in addition to completing legal procedures.',
    'Only the contract holder may drive. Driving by anyone else is not covered and all costs will be borne by the contract holder.',
    'The contract holder is responsible for managing the vehicle during the rental period, regardless of fault by third parties.',
    'If you receive a parking violation, promptly report to the local police station and pay the fine. Present the payment slip upon return.\n\nIf payment is not confirmed at return, a parking violation fee of ¥20,000 per incident will be charged.\n\nIf you fail to handle the violation or pay the fee, we will report the violation (including personal information) to the police/public safety commission, register you in our caution list, and refuse future rentals.\n\nIf you later pay the fine and present the traffic violation notice and receipt with a stamp, the parking violation fee will be refunded.',
    'Use in races, tests, circuits, or on non-maintained roads such as beaches, riverbeds, or forests is prohibited.',
    'Repair costs for punctures, tire damage, or deterioration caused by poor usage are the contract holder&apos;s responsibility.',
    'If fall damage is significant, we may charge the estimated repair cost. A deposit is collected at return. With optional vehicle coverage, a ¥50,000 deposit is collected at return. We assess the vehicle after return and refund any remaining amount.\n\nDeductible standards: If the vehicle is returned in a condition suitable for immediate rental with only minor scratches, the deductible is ¥20,000. If parts replacement or repairs are required for riding, or if the vehicle loses its value, the deductible is ¥50,000. Delayed return is not covered.',
    'Business compensation is charged regardless of whether vehicle coverage is purchased and follows the same standards as the vehicle coverage deductible.',
    'Towing distance is limited to 180 km. Additional distance is charged to the contract holder.',
    'Transportation and lodging expenses incurred due to towing are covered up to ¥19,000 for transportation and ¥15,000 for lodging; any excess is the contract holder&apos;s responsibility.',
    'To request an extension, you must call and visit the store by the extension start time with the vehicle and in person. Returns after the scheduled time are treated as extensions.',
    'If the contract period is exceeded without notice, you will be charged double the rental fee (24 hours) per day of delay.',
    'If you use the vehicle beyond the contract period without notice, insurance benefits will not be paid in the event of an accident or other violations of the rental agreement.',
    'Returning the vehicle outside business hours (closed every Monday) or without staff present is strictly prohibited due to security systems. Violations will be prosecuted for trespassing.',
    'If the vehicle is not returned by the due date, you agree to recovery without objection. Any towing costs incurred are the contract holder&apos;s responsibility.',
    'If you fail to return the vehicle without notice (even one day) despite scheduled reservations, we will immediately file a theft report with the police.',
    'You confirm that you are not a member of, or related to, organized crime groups or other antisocial organizations.',
    'If an accident (including a fall) occurs, the rental contract ends at that time. Rental fees are non-refundable.',
    'Phone mounts, cigarette sockets, and ETC units are provided as a service. We are not responsible for any issues such as device drops.',
    'If you exceed the mileage guideline set by the company and the vehicle breaks down or has trouble, repair costs including roadside assistance are the borrower&apos;s responsibility.',
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Head>
        <title>Terms of Use - ヤスカリ</title>
      </Head>
      <h1 className="text-2xl font-bold mb-4">Terms of Use &amp; Notes</h1>
      <ol className="list-decimal pl-5 space-y-4 text-sm leading-relaxed">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ol>
    </div>
  )
}
