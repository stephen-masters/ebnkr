describe("ebnkr IBAN Validator", function() {

    /**
     * IBANs tend to be written as multiple 4-character space-separated blocks.
     * This method will strip out all non-alpha-numeric characters.
     */
    describe("compactFormat", function() {

        it("should not modify strings that do not contain non-alpha-numerics", function() {
            // The simplest possible case.
            expect(ebnkr.compactFormat("")).toEqual("");
            // Leave lower-case alone.
            expect(ebnkr.compactFormat("foo")).toEqual("FOO");
            // Leave upper-case alone.
            expect(ebnkr.compactFormat("FOO")).toEqual("FOO");
            // Leave numbers alone.
            expect(ebnkr.compactFormat("123")).toEqual("123");
        });

        it("should remove non-alpha-numerics", function() {
            expect(ebnkr.compactFormat("foo bar")).toEqual("FOOBAR");
        });

    });
  
    /**
     * This step in the IBAN validation moves the first 4 characters to the end.
     */
    describe("shiftFirstFourCharsToEnd", function() {
        
        it("should shift the first 4 characters in a string to the end", function() {
            var result;

            result = ebnkr.shiftFirstFourCharsToEnd("");
            expect(result).toEqual("");

            result = ebnkr.shiftFirstFourCharsToEnd("ab");
            expect(result).toEqual("ab");

            result = ebnkr.shiftFirstFourCharsToEnd("abcd");
            expect(result).toEqual("abcd");

            result = ebnkr.shiftFirstFourCharsToEnd("abcdefgh");
            expect(result).toEqual("efghabcd");
        });
        
    });
  
    /**
     * The letters are converted to numbers as follows:
     *     A=10, B=11, C=12, ..., Z=35
     */
    describe("toNumericForm", function() {
        
        it("should return 0=0,..,A=10,..,Z=35", function() {
            expect(ebnkr.toNumericForm("0")).toEqual("0");
            expect(ebnkr.toNumericForm("a")).toEqual("10");
            expect(ebnkr.toNumericForm("z")).toEqual("35");
            expect(ebnkr.toNumericForm("A")).toEqual("10");
            expect(ebnkr.toNumericForm("Z")).toEqual("35");
            expect(ebnkr.toNumericForm("ABC")).toEqual("101112");
            expect(ebnkr.toNumericForm("AD1200012")).toEqual("10131200012");
        });
        
    });
    
    /**
     * We need to get remainder of dividing a very large number by 97.
     * As JavaScript doesn't cater for arbitrarily long numbers, this method 
     * implements an iterative modulus calculation.
     */
    describe("mod97", function() {
        
        it("should return the remainder of dividing by 97", function() {
            expect(ebnkr.mod97("97")).toEqual(0);
            expect(ebnkr.mod97("10")).toEqual(10);
            expect(ebnkr.mod97("100")).toEqual(3);
            expect(ebnkr.mod97("9700000000000000000000000")).toEqual(0);
            expect(ebnkr.mod97("9700000000000000000000003")).toEqual(3);
            // Ignore leading zeroes.
            expect(ebnkr.mod97("00009700000000000000000000003")).toEqual(3);
        });
        
    });

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
    describe("isValidIBAN", function() {

        it("should accept a valid IBAN with no spaces", function(){
            expect(ebnkr.isValidIBAN("AD1200012030200359100100")).toEqual(true);
        });

        it("should accept a valid IBAN with no spaces, but lower case country code", function() {
            expect(ebnkr.isValidIBAN("ad1200012030200359100100")).toEqual(true);
        });

        it("should accept a valid IBAN with space separators", function() {
            expect(ebnkr.isValidIBAN("AD12 0001 2030 2003 5910 0100")).toEqual(true);
        });

        it("should accept valid IBANS from a variety of countries", function() {
            expect(ebnkr.isValidIBAN("AT61 1904 3002 3457 3201")).toEqual(true);
            expect(ebnkr.isValidIBAN("BE68 5390 0754 7034")).toEqual(true);
            expect(ebnkr.isValidIBAN("BG38CECB97904261581300")).toEqual(true);
            expect(ebnkr.isValidIBAN("CH93 0076 2011 6238 5295 7")).toEqual(true);
            expect(ebnkr.isValidIBAN("CS73 2404 3000 2546 2004 35")).toEqual(true);
            expect(ebnkr.isValidIBAN("CY17 0020 0128 0000 0012 0052 7600")).toEqual(true);
            expect(ebnkr.isValidIBAN("CZ65 0800 0000 1920 0014 5399")).toEqual(true);
            expect(ebnkr.isValidIBAN("DE89 3704 0044 0532 0130 00")).toEqual(true);
            expect(ebnkr.isValidIBAN("DK50 0040 0440 1162 43")).toEqual(true);
            expect(ebnkr.isValidIBAN("EE38 2200 2210 2014 5685")).toEqual(true);
            expect(ebnkr.isValidIBAN("ES91 2100 0418 4502 0005 1332")).toEqual(true);
            expect(ebnkr.isValidIBAN("FI21 1234 5600 0007 85")).toEqual(true);
            expect(ebnkr.isValidIBAN("FR14 2004 1010 0505 0001 3M02 606")).toEqual(true);
            expect(ebnkr.isValidIBAN("GB60CITI18500808021422")).toEqual(true);
            expect(ebnkr.isValidIBAN("GB29 NWBK 6016 1331 9268 19")).toEqual(true);
            expect(ebnkr.isValidIBAN("GI75 NWBK 0000 0000 7099 453")).toEqual(true);
            expect(ebnkr.isValidIBAN("GR16 0110 1250 0000 0001 2300 695")).toEqual(true);
            expect(ebnkr.isValidIBAN("HR12 1001 0051 8630 0016 0")).toEqual(true);
            expect(ebnkr.isValidIBAN("HU42 1177 3016 1111 1018 0000 0000")).toEqual(true);
            expect(ebnkr.isValidIBAN("IS14 0159 2600 7654 5510 7303 39")).toEqual(true);
            expect(ebnkr.isValidIBAN("IE29 AIBK 9311 5212 3456 78")).toEqual(true);
            expect(ebnkr.isValidIBAN("IL120310650000000261351")).toEqual(true);
            expect(ebnkr.isValidIBAN("IT60 X054 2811 1010 0000 0123 456")).toEqual(true);
            expect(ebnkr.isValidIBAN("LU36 0029 1524 6005 0000")).toEqual(true);
            expect(ebnkr.isValidIBAN("LV80HABA0551009145677")).toEqual(true);
            expect(ebnkr.isValidIBAN("LT12 1000 0111 0100 1000")).toEqual(true);
            expect(ebnkr.isValidIBAN("LI21 0881 0000 2324 013A A")).toEqual(true);
            expect(ebnkr.isValidIBAN("LU28 0019 4006 4475 0000")).toEqual(true);
            expect(ebnkr.isValidIBAN("MK07 300 0000000424 25")).toEqual(true);
            expect(ebnkr.isValidIBAN("MT84 MALT 0110 0001 2345 MTLC AST001S")).toEqual(true);
            expect(ebnkr.isValidIBAN("NL91 ABNA 0417 1643 00")).toEqual(true);
            expect(ebnkr.isValidIBAN("NO93 8601 1117 947")).toEqual(true);
            expect(ebnkr.isValidIBAN("PL27 1140 2004 0000 3002 0135 5387")).toEqual(true);
            expect(ebnkr.isValidIBAN("PT50 0002 0123 1234 5678 9015 4")).toEqual(true);
            expect(ebnkr.isValidIBAN("RO49 AAAA 1B31 0075 9384 0000")).toEqual(true);
            expect(ebnkr.isValidIBAN("SK31 1200 0000 1987 4263 7541")).toEqual(true);
            expect(ebnkr.isValidIBAN("SI56 1910 0000 0123 438")).toEqual(true);
            expect(ebnkr.isValidIBAN("SE35 5000 0000 0549 1000 0003")).toEqual(true);
            expect(ebnkr.isValidIBAN("TR140006200054700009094976")).toEqual(true);
        });

        it ("should reject invalid IBANS", function() {
            expect(ebnkr.isValidIBAN("ES95 0217 0100 17")).toEqual(false);
            expect(ebnkr.isValidIBAN("LU36 0029 1534 6005 0000")).toEqual(false);
            expect(ebnkr.isValidIBAN("TN59 1421 7207 1007 0712 9648")).toEqual(false);
        });

    });
  
});
