/**
 *  
 * @author Stephen Masters
 */
var ebnkr = {

    /**
     * An International Bank Account Number (IBAN) is an international standard 
     * for identifying bank accounts. ISO 13616-1:2007
     * 
     * Ref: http://en.wikipedia.org/wiki/International_Bank_Account_Number
     * 
     * The standard provides a mechanism for validating an IBAN based on a checksum.
     * This is a simple validator to generate and validate that checksum.
     * 1. All non-alpha-numeric chars are removed.
     * 2. The First 4 digits of the IBAN, the Country Code and Check Digit, 
     *    are moved to the end of the IBAN.
     * 3. The letters are converted to numbers as follows:
     *        A=10, B=11, C=12, ..., Z=35
     *
     * 4. The resultant number is then divided by 97.  
     *    If the remainder is 1, then the IBAN is valid.
     * 
     * http://en.wikipedia.org/wiki/International_Bank_Account_Number
     */
    isValidIBAN : function(iban) {
        var valid = false;

        // The IBAN with spaces stripped out. Dimension to the same size as IBAN to be safe.
        var strippedIBAN = ebnkr.compactFormat(iban);

        // Shift first four characters to the end.
        var shiftedIBAN = ebnkr.shiftFirstFourCharsToEnd(strippedIBAN);
        
        // Convert to numbers.
        var numericIBAN = ebnkr.toNumericForm(shiftedIBAN);

        var checksum = ebnkr.mod97(numericIBAN);
   
        return checksum == 1;
    },
    
    /**
     * We need to get remainder of dividing a very large number by 97.
     * As JavaScript doesn't cater for arbitrarily long numbers, this method 
     * implements an iterative modulus calculation.
     *   1. Take the first 8 digits.
     *   2. Calculate that result mod 97.
     *   3. Append the next 6 digits to the result.
     *   4. Repeat 2 & 3 until there are no more digits to append.
     */
    mod97 : function(numstr) {
        // Remove leading zeroes.
        for (var i = 0 ; i < numstr.length ; i++) {
            if (i > 0) break;
        }
        
        var dividend = numstr.substring(0, i + 7);
        var remainder = dividend % 97;
        // console.log("mod97(" + numstr + "), dividend=[" + dividend + "], remainder=[" + remainder + "]");
        if (numstr.length > 8) {
            return ebnkr.mod97(remainder + "" + numstr.substring(8, numstr.length));
        } else {
            return remainder;
        }
    },

    toNumericForm : function(iban) {
        var numeric = "";
        for (var i = 0 ; i < iban.length ; i++) {
            var ch = iban.charAt(i);
            var code = iban.charCodeAt(i);
            // console.log("iban charAt(" + i + ") = [" + ch + "], charCodeAt(" + i + ") = [" + code + "]");
            if (code >= 48 && code <= 57) {
                // 0-9
                numeric += ch;
            } else if (code >= 97 && code <= 122) {
                // a-z
                numeric += code - 87;
            } else if (code >= 65 && code <= 90) {
                // A-Z
                numeric += code - 55;
            } else {
                // The text should have been cleaned already.
                // But if not, ignore any dodgy characters.
            }
        }
        return numeric;
    },

    /**
     * IBANs tend to be written as multiple 4-character space-separated blocks.
     * Some folks use hyphens.
     * This method will strip out all non-alpha-numeric characters.
     */
    compactFormat : function(iban) {
    	var cleaned = iban.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
    	//console.log("IBAN [" + iban + "] cleaned is [" + cleaned + "]");
    	return cleaned;
    },

    /**
     * This step in the IBAN validation moves the first 4 characters to the end.
     */
    shiftFirstFourCharsToEnd : function(iban) {
    	return iban.substring(4,iban.length) + iban.substring(0,4);
    }

};
