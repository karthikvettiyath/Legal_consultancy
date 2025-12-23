export function numberToWords(num) {
    if (num === 0) return "Zero";

    const a = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
    ];
    const b = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
    ];

    function inWords(n) {
        if (n < 20) return a[n];
        const digit = n % 10;
        if (n < 100) return b[Math.floor(n / 10)] + (digit ? " " + a[digit] : "");
        if (n < 1000)
            return (
                a[Math.floor(n / 100)] +
                " Hundred" +
                (n % 100 == 0 ? "" : " and " + inWords(n % 100))
            );
        return "";
    }

    // Handling larger numbers (Thousands, Lakhs/Millions?)
    // Indian numbering system vs International?
    // The sample text says "TWENTY FOUR THOUSAND SIX HUNDRED AND TWENTY FIVE ONLY".
    // Let's support standard international for thousands, which works for this range.
    // Actually, let's just make it robust enough for typical invoice amounts (up to millions).

    let str = "";

    if (num >= 10000000) {
        str += numberToWords(Math.floor(num / 10000000)) + " Crore ";
        num %= 10000000;
    }
    if (num >= 100000) {
        str += numberToWords(Math.floor(num / 100000)) + " Lakh ";
        num %= 100000;
    }
    if (num >= 1000) {
        str += numberToWords(Math.floor(num / 1000)) + " Thousand ";
        num %= 1000;
    }

    str += inWords(num);

    return str.trim();
}
