please create a plugin for VSCode that adds syntax highlighting and formatting for Hotmeal programming language. Here's the documentation for Hotmeal:
```
Introduction
------------
HotMeal is preprocessor-style language embedded into HTML.
You write in HTML, and add HotMeal statements, that start with '#'.

Text files with .html extension are interpreted as HotMeal files.

If line does not start with # then it is an HTML line that is sent to output.

If line starts with # then this is HotMeal line, a statement in HotMeal language.


Variables
HTML lines are subject to variable substitution, before they are sent to output.

Any sequence of alphanumeric characters and '_' can form a variable name.

Variable is defined by #define statement.

Variable names are replaced with variable values without any regard for spaces or tokenization,
so you never have to worry how using single or double quotes affects the output.
But variable names must be long and unique enough, so that substituting them does not damage HTML or text content.

Example: do not use variable named 'a', as there is plenty of 'a' in English HTML text.
But do use variable named '__a__', as such string is not likely to occur in English text or HTML.

Variables are kept in Variables Map: CStringA -> CStringA.
Which means that both variable names and values are UTF-8 strings.
Non-English variable names and values are allowed.
Variables have no type, all variable values are strings.
Variable values may be converted to numbers when needed, such as in <= compare op.

Variable substitutions in HTML text and HotMeal statements are done in one of these ways:
- VarName is replaced with value of variable named VarName.
   If not found, the original text remains.
- ##VarName## is replaced with value of variable named VarName.
   If variable is not found, replace with empty string.
- ##'VarName'## is replaced with value of variable named VarName,
   escaped for SQL strings: ' -> \'    " -> \"
- ##&VarName&## is replaced with value of variable named VarName,
   escaped for HTML: ' -> &#39;    " -> &quot;    & -> &amp;
- ##%VarName%## is replaced with value of variable named VarName,
   url-encoded: + -> %2B    \ -> %5C
- ##*VarName*## is replaced with value of variable named VarName,
   escaped for JSON: \n, \t, slashes and double-quotes prepended with a backslash.
- ##,VarName,## for writing out long number with thousand "," separator


Control and Nesting
Include Stack:
Nested #include statements, similar to C, are implemented.
Include Stack keeps track of file positions and names.

If Stack:
Nested #if - #elseif - #endif statements are implemented.
If Stack keeps track of current If-Else execution state.

ForEach Stack:
Nested #foreach - #endfor statements are implemented.
ForEach Stack keeps track of loop variable state.

Call Stack:
Nested #call for procedures is implemented.
Procedure is defined by #procedure - #endproc statements.
Procedure map maintains declared procedures.
Call Stack maintains called procedure state.


Tokens
All statement syntax rules below are written in terms of tokens.
Token is a basic unit of text, bigger than a character, but smaller than a statement.

Token is a sequence of characters delimited by ' ' or '\t' or ',' or '(' or ' ' or ')'.

A special string token starts with " and ends with " and then it can have any characters inside,
including characters that if used outside of " " would delimit tokens.

Inside " " string token you can use escape sequences: \n \\ \" \NNN


Pre-Defined Variables
Some variables are set by HotMeal itself, to identify web client that made the call to this .html file.

Name	Meaning	Current Value	Value Range
__client_browser__	Client Browser	chrome	chrome | firefox | iphone | msie | safari
__client_browser_ver__	Client Browser Version	133	105.1.0.0
__client_os__	Client OS	linux	windows | macosx | linux | java | android
__client_os_ver__	Client OS version		10
__client_size__	Client Size		(empty) | tablet | phone
__client_ip_addr__	IP address	79.175.112.46	NNN.NNN.NNN.NNN
__client_lang__	Language preferred by Client Browser,
from Accept-Language header	en-us	IETF format, lowercase
__client_auth_userid__	Auth UserId		userid
__client_blocked__	Client Is Blocked		(empty) | 1
__client_descr__	Client Description	Chrome on Linux	Chrome on Windows 10
Parsed URI-related variables
__base_uri__	Base URI of this page	https://www.siber.com	any-string
__rel_uri__	Relative URI of this page	/hotmeal	any-string
__post_quest__	URI after '?'		any-string
GeoLocation variables, available after call of #ipaddr-geoinfo __client_ip_addr__
__geo_iprange_beg__	IP range begin	79.175.109.0	NNN.NNN.NNN.NNN
__geo_iprange_end__	IP range end	79.175.114.0	NNN.NNN.NNN.NNN
__geo_continent__	Continent	EU	AF, NA, OC, AN, AS, EU, SA
__geo_country__	Country Code	RS	ZZ
__geo_stateprov__	State or Province	Central Serbia	any-string
__geo_city__	City	Belgrade	any-string
__geo_district__	District	Belgrade	any-string
__ipaddr_ipname__	IpName		any-string
__ipaddr_whois__	WhoIs		any-string
__ipaddr_act_type__	IPaddr Type		C is client, S is server, V is VPN or Anon
__ipaddr_act_html__	Action HTML		0 is bad, 1 is good, - is dont care
__ipaddr_act_smtp__	Action SMTP		0 is bad, 1 is good, ? is BigMailer, * is decent mailer
Date/Time variables. Pre-defined. You can update them with #curr-datetime
__date_time__	Current Date Time	250304-051446	YYMMDD-HHMMSS
__time_now__
__time_curr__	Current Time Unix	1741083286
1741083286	0 .. 2^32-1
__time_minute__	Current Minute	14	00 .. 59
__time_hour__	Current Hour	05	00 .. 23
__date_day__	Current Day	04	01 .. 31
__date_month__	Current Month	03	01 .. 12
__date_year__	Current Year	25	(20) 00 .. 99
__date_dow__	Day of Week	2	0 .. 6
Server activity variables
__weight_last_sec__	Weight in Last Sec	0	0 .. 1000
__weight_last_min__	Weight in Last Min	0	0 .. 1000
__weight_last_hour__	Weight in Last Hour	0	0 .. 1000
__threads__	Number of Thread	875	0 .. 100000

Statements

#define VarName VarValue
Define variable named VarName, assign it string value from VarValue.
VarValue is a token, so if it contains spaces, it must be enclosed in " ".
Variable inside VarValue are resolved when #define is executed (no lazy evaluation here).
Example:

#define __var__ "variable value here"

#append VarName VarValue
Define variable named VarName, its new value becomes concatenation of its current value and value of VarValue.

#define-long VarName
Start definition of variable named VarName, assign it multi-line value that ends with #end-define statement.

#end-define
End multi-line value started by #define-long
Example:

#define-long __var__
Multi-line String Line 1
Multi-line String Line 2
#end-define

#append-long VarName
Start definition of variable named VarName, assign it concatenation of current value and multi-line value that ends with #end-append statement.

#end-append
End multi-line value started by #append-long
Example:

#append-long __var__
Multi-line String Line 1
Multi-line String Line 2
#end-append

#procedure ProcName ( ProcParam1 [, [out] ProcParamN]... )
Start definition of line-oriented procedure named ProcName, with parameters ProcParam1 [, ProcParamN]...
By default, procedure parameters are of the 'in' variety: when procedure is called by #call, they are assigned values from #call.

If parameter has 'out' prefix before it, then its value is assigned to variable designated in #call, after the procedure has run.


#endproc
End definition of procedure started by #procedure statement.
Example:

#Procedure HashCompanyAdministratorPassword( __in_admin_email__ , __in_password__ , out __pass_hash__ )
#define __pre_hash__  __in_admin_email__:__in_password__
#md5-hash __pass_hash__ __pre_hash__
#end-proc

#call procName ( ParamValue1 [, ParamValueN]... )
Call previously defined procedure named ProcName, with parameters ParamValue1 [, ParamValueN]...
Example:

#call HashCompanyAdministratorPassword( "userid@company.com" , "plain-password" , __admin_pass_hash__ )
This call results in variable __admin_pass_hash__ being assigned
MD5 hash of the string "userid@company.com:plain-password".


String Operations

#md5-hash VarName VarValue
Compute MD5 hash (as a Hex) of string in VarValue and assign it to variable named VarName.

#curr-datetime
Set __date_time__ to current date-time in %02d%02d%02d-%02d%02d%02d format.

#ipaddr-geoinfo IPAddressVar
Lookup Geo Info for IP addr at variable IPAddressVar and deposit it to variables __geo_xxxxx__:
__geo_iprange_beg__
__geo_iprange_end__
__geo_continent__:
        AF = Africa
        NA = North America
        OC = Oceania
        AN = Antarctica
        AS = Asia
        EU = Europe
        SA = South America
__geo_country__
__geo_stateprov__
__geo_city__
__geo_district__
__ipaddr_ipname__
__ipaddr_whois__

#str-eval VarName
Evaluate (substitute __var__) in contents of variable VarName and write it back to VarName.

#str-replace VarName StrFrom StrTo
In variable named VarName replace all occurrences of StrFrom with value of StrTo.

#str-split VarName StrSplitter VarNameToPre VarNameToPost
Split value of variable VarName by splitter StrSplitter into variables VarNameToPre and VarNameToPost.
Example:

#define __var__ "ABC:DE:FGH"
#str-split __var__ ":" __var_pre__ __var_post__
##__var_pre__##<br>  // ABC
##__var_post__##<br> // DE:FGH

#str-break VarName BreakPosn VarNameToPre VarNameToPost
Break value of variable VarName at position BreakPosn (numeric decimal, starting with 0, which would mean an empty VarNameToPre)
into variables VarNameToPre and VarNameToPost.
So, the length of VarNameToPre will be min(BreakPosn, length(VarName)).

#str-trim VarName TrimChars
In variable named VarName trim on the left and right all occurrences of TrimChars.

#str-mask VarName SubstringFrom SubstringTo
Partially mask the contents of variable VarName with *s — between substrings SubstringFrom and SubstringTo.
When masking more than 10 chars, put only 10 *s to the output.

#str-tolower VarName
In variable named VarName lower-case all characters.

#str-toupper VarName
In variable named VarName upper-case all characters.

#str-encrypt VarName SecretWord
Encrypt VarName value with SecretWord, using AES 256-CBC algorithm, write it back to VarName.

#str-decrypt VarName SecretWord
Decrypt VarName value with SecretWord, using AES 256-CBC algorithm, write it back to VarName.

#str-rsa-sign VarName EncyptionKey SignatureVarName
Sign value of VarName with value of EncyptionKey, write result to variable SignatureVarName.

#dml-encode VarName
DML-encode value of VarName, write it back to VarName.

#dml-decode VarName
DML-decode value of VarName, write it back to VarName.

#math add|sub|mul|div VarName Value2
Math operations on integers:
@VarName = @VarName +|-|*|/ Integer(Value2)
Variable var-name must contain string representing integer value.
Value string must evaluate to decimal integer.


#generate-password
Generate pseudo-random password and write it to variable __password__


#random RangeDigits VarName
Generate random number in the [0,RangeDigits) range and write it to variable VarName.


File Operations

#mkdir FolderPath
Make folder at path FolderPath, starts with /.
If folder has been created, set variable __rc__ to 1.
Otherwise set __rc__ to 0 and __serr__ to error message.


#read-file FilePath StrVarName
Read file located at FilePath into variable StrVarName.
If read operation succeeded, set variable __rc__ to 1.
Otherwise set __rc__ to 0 and __serr__ to error message.


#write-file FilePath FileBodyStr
Write file located at FilePath from value FileBodyStr.
If write operation succeeded, set variable __rc__ to 1.
Otherwise set __rc__ to 0 and __serr__ to error message.


#append-file FilePath FileBodyStr
Write to file located at FilePath from value FileBodyStr.
If append operation succeeded, set variable __rc__ to 1.
Otherwise set __rc__ to 0 and __serr__ to error message.


Database (MySql) Operations

#db-row-format OutputRowFormat
Specify format of each output row for #db-select statement.
Special value "list" of OutputRowFormat causes #db-select to write to string list.

#db-row-format-last OutputRowFormat
Specify format of the last output row for #db-select statement.

#db-select SqlStatement
Execute DB SQL SELECT statement SqlStatement.
For now we work only with MySQL DB, but addition of other databases should be easy.
If execution of query is successful then variable __rc__ is assigned 1.
If execution ended in error then __rc__ is assigned 0 and variable __serr__ receives text error messages.

Upon success Resulting rows are written out (to HTML output),
number of output rows is written to variable __rows__ ,
each row formatted per format specified by preceding #db-row-format statement.

The selected values are assigend to variables __db_col_1__, __db_col_2__, etc.
NULL value renders to an empty string.

Example: Display SQL SELECT results as a HTML table:

<table border=1>
<tr><td>Company Id</td><td>Company Name</td><td>Global Job Options</td><td>Delete</td></tr>
#db-row-format "<tr><td>__db_col_1__</td><td>__db_col_2__</td><td>__db_col_3__</td><td><input type='checkbox' name='delete_co' value='__db_col_1__'></td></tr>"
#db-select "SELECT company_id, company_name, global_job_options FROM Companies"
#if __rc__ != 1
    __serr__
#endif
</table>

#db-select-rows SqlStatement
Same as #db-select but add line 'Records: NNN' at the start of the output table.
It tell the user how many DB records were returned and printed to output.

#db-select-to-list SqlStatement
Execute DB SQL SELECT statement SqlStatement.
If execution of query is successful then variable __rc__ is assigned 1.
If execution ended in error then __rc__ is assigned 0 and variable __serr__ receives text error messages.

Upon success the resulting output lines are stuffed into a single string and written to variable __db_rows__

This single string represents a list of maps, it can be parsed and used in #foreach.

Number of written rows is written to variable __rows__


#db-execute SqlStatement
Execute DB SQL SELECT statement SqlStatement that does not produce output rows (such as INSERT or UPDATE).
If execution is successful then variable __rc__ is assigned 1.
Variables __affected_rows__ and __insert_id__ are also set.

If execution ended in error then __rc__ is assigned 0 and variable __serr__ receives text error messages.

Example: Insert record into database:

#db-execute "INSERT INTO Administrators (company_id, admin_email, admin_name, pass_hash, created_at) \
             VALUES ('##'__db_col_1__'##', '##'__form__admin_email__'##', '##'__form__admin_name__'##', '##'__pass_hash__'##', now()) ;"
#if __rc__ != 1
    __serr__
    #return
#endif

Loop and List Operations

#num-seq-to-list ListVarName NoFrom NoTo NoStep
Execute FOR loop and write result into variable ListVarName, it can be used in #foreach.
For (ListVar = NoFrom; ListVar < NoTo; ListVar += NoStep)
The resulting ListVar is intended to be used then in #foreach.

#set-list OutVar Element1 Element2 ... ElementN
Set variable OutVar value to be list of elements with values Element1 Element2 ... ElementN.


#foreach VarName ListString
Loop variable VarName thru elements of list encoded in value of ListString.
#db-select-to-list format produces such encoded-list string.
All statements from the next one to #endfor are executed for each element of the list.

#endfor
Close #foreach loop.

#break
Breaks #foreach loop.

Local Map Operations
Local Maps live only during one HTTP call.

But they can be read from TIC-encoded strings and written to TIC-encoded strings.


#set-map MapVar Name1=Value1 Name2=Value2 ... NameN=ValueN
Set variable MapVar to be encoded map of Name1=Value1 Name2=Value2 ... NameN=ValueN

#encode-map is equivalent to #set-map.


#parse-map MapString
Parse map encoded in string MapString into variables defined by name=bvalue of the map.

Example: Enumerate records returned by SQL SELECT statement.

#db-select-to-list "select company_id, company_name, global_job_options from Companies ;"
#if __rc__ != 1
   __serr__
#else
  #foreach __row__ __db_rows__
    #parse-map __row__
    <br> Id=__col_1__ Name=__col_2__ Opts=__col_3__
  #endfor
#endif
#decode-map is equivalent to #parse-map.


Global Map Operations
Global Maps are common to all threads, and they survive between thread invocations.


#global-map-set MapNameStr KeyStr ValueStr
Set element of global map named MapNameStr at key KeyStr to value ValueStr


#global-map-lookup MapNameStr KeyStr ValueVarName
Lookup element of global map named MapNameStr at key KeyStr and write it to variable ValueVarName.


#global-map-reset MapNameStr
Reset global map named MapNameStr: delete all keys.


#global-map-delete MapNameStr KeyStr
Delete element of global map named MapNameStr at key KeyStr.


#parse-json JsonStr JsonPath
Parse data contained in JsonStr in JSON format, starting at path JsonPath and deeper, into a set of variables that include Maps for multi-level JSON objects.

These variables are written:
__rc__ 1 for success, 0 for error,
__serr__ parsing error message, if __rc__ is 0.
__type__ type of data: "value", "list", "map"
__type_xxx__ types of fields named xxx.
__value__ data value. Can be a string, list or map (encoded with TIC), depending on __type__
__value_xxx__ parsed values for fields named xxx.

Example 1: Parse flat map:

#define __str__ {"name":"John", "age":28}
#parse-json __str__ ""
#if __rc__ != 1
   __serr__
#endif
// 1st level variables are ready:
##__value_name__## <br> // John
##__value_age__## <br> // 28
Example 2: Parse starting at path:

#define __str__ {"v1":{"a":123, "b":456}, "v2":{"v3":{"a":111, "b":222}, "v4":333}}
#parse-json __str__ "v2.v3"
#if __rc__ != 1
   __serr__
#endif
// 1st level variables are ready:
##__value_a__## <br> // 111
##__value_b__## <br> // 222
Example 3: Parse list:

#define __str__ ["q", "w", "e"]
#parse-json __str__ ""
#foreach __row__ __value__
  #decode-map __row__
  __index__ : __value__ <br>
#endfor
// Outputs:
0 : q
1 : w
2 : e

Session Operations
Session is a data-storage memory entity that survives between threads/connections.

So you can store data in Sessions, that will stay there as long as HotMeal server runs.

Sessions are similar to Global Maps, but they also contain IP addr and UserId, to make them ideal for Browser-side sessions.


#session-create UserId
Generate unique SessionId and store it in variable __session_id__
Create session under key SessionId, store ClientIpAddr and UserId in this session.
Sessions are stored in memory of the Server and data from them can be extracted in the subsequent HTTP transactions.

So data in the session is persistent between HTTP transactions but it does not survive server shutdown/restart.


#session-lookup SessionId
Lookup session by SessionId.
If session has been found then Set variables:
__session_exists__ = 1
__session_user_id__ = UserId
__session_ip_addr__ = ClientIpAddr

If session has not been found then Set variable:
__session_exists__ = 0


#session-delete SessionId
Delete session by SessionId.

Conditional Statement and Operations

#if ConditionalExpression
Start If statement.
If ConditionalExpression is True then output lines staring with the next line and ending before the next #elseif or #else or #endif statement, whichever comes first.

If ConditionalExpression is False then skip lines staring with the next line and ending before the next #elseif or #else or #endif statement, whichever comes first.


#elseif ConditionalExpression
If ConditionalExpression of the preceding #if is False and this ConditionalExpression Is True then output lines staring with the next line and ending before the next #elseif or #else or #endif statement, whichever comes first.

#else
If ConditionalExpression of all preceding #if and #elseif statements is False then output lines staring with the next line and ending before the next #endif statement.

#endif
Closes #if statement.

ConditionalExpression
In the above ConditionalExpression can be one of the following:

VarName is-defined
VarName is defined.

VarName is-true
VarName value is '1'.

VarName is-false
VarName value is '0'.

VarName is-empty
VarName value is '' (empty).

VarName is-integer
VarName value is integer.

VarName is-email
VarName value is valid Email.

VarName is-userid
VarName value is valid UserId.

VarName is-file-name
VarName value is valid File Name.

VarValue file-exists
VarName value is file path of file that exists, path is relative or absolute.

VarValue file-exists-abs
Annam value is file path of file that exists, path is absolute.

VarName contains-any Value2
VarName value contains any of chars from Value2.

VarName contains-all Value2
VarName value contains all of chars from Value2.

VarName contains-only Value2
Variable VarName value contains only chars from Value2.

VarName contains-str Value2
VarName value contains string Value2.

VarName ~i Value2
VarName value fits the range of Value2, crontab style.

VarName ~s Value2
VarName value string-matches Value2.

VarName == Value
VarName value equals Value2.

VarName =< Value
VarName value left-equals Value2.

VarName left-eq Value
VarName value left-nocase-equals Value2.

VarName => Value
VarName value right-equals Value2.

VarName right-eq Value
VarName value right-nocase-equals Value2.

VarName length== IntValue
VarName value length equals length of Value2.

VarName != Value
VarName value does not equal Value2.

VarName length!= IntValue
VarName value length does not equal length of Value2.

VarName >= IntValue
VarName value (numeric) is more or equal to Value2 (numeric).

VarName length>= IntValue
VarName value length is more or equal Value2 (numeric).

VarName > IntValue
VarName value (numeric) is more than Value2 (numeric).

VarName >+IntValue VarName2
VarName value (numeric) is more than value of VarName2 (numeric) plus IntValue (numeric).

VarName <= IntValue2
VarName value (numeric) is less or equal to IntValue2 (numeric).

VarName < IntValue2
VarName value (numeric) is less than IntValue2 (numeric).

VarName length< IntValue2
VarName value length less than IntValue2.

VarName range IntValue1 IntValue2
VarName value (numeric) is between IntValue1 and IntValue2.

Logical Connectors:
In the above ConditionalExpression the following Logical Connectors can be used:
ConditionalExpression && ConditionalExpression
ConditionalExpression || ConditionalExpression

Negation:
Individual ConditionalExpression can be negated:
! ConditionalExpression


#ifdef VarName
If variable VarName is defined and has non-empty value then output lines staring with the next line and ending before the next #else or #endif statement, whichever comes first.
If variable VarName is not defined or it has empty value then skip lines staring with the next line and ending before the next #else or #endif statement, whichever comes first.


#ifndef VarName
Same as #ifdef, only is-defined condition is reverted.

HTTP Header Operations

#parse-uri
Parse this page URI parameters into variables.
URI www.server.com/dir/file?p1=v1&p2=v2&...&pN=vN produces these variables:
__uri__p1__ = v1
__uri__p2__ = v2
...
__uri__pN__ = vN

Variable __rc__ receives success code (1 or 0).
Variable __serr__ receives parsing error message, if __rc__ is 0.


#url-encode UrlStr
URL-encode value of variable var-name and put it back into this variable.


#parse-cookies
Parse cookies submitted by HTTP agent (browser) to this page.
'Cookies' header of received HTTP transaction contains cookies names and values in official cookie format.

Defines these variables:
__cookie__p1__ = v1
__cookie__p2__ = v2
...
__cookie__pN__ = vN


#set-cookie Name Value Domain ExpireDays
Set cookies named Name to value Value in the domain Domain, set to expire in ExpireDays days.

This statement results in adding this line to output headers:
Set-Cookie: Name=Value; domain=Domain; path=/; expires=ExpireDays


#set-header NameStr ValueStr
Set output Header named NameStr to ValueStr. Do not use this to set cookies.


#get-header NameStr VarName
Get input header named NameStr and write it into variable VarName.


#set-content-type ValueStr
Set Content-Type of output to ValueStr.


HTTP Body Operations

#parse-form
Parse form values submitted to this page into variables.
Body of received HTTP transaction contains submitted form results in the format:
p1=v1&p2=v2&...&pN=vN

Defines these variables:
__form__p1__ = v1
__form__p2__ = v2
...
__form__pN__ = vN

Variable __rc__ receives success code (1 or 0).
Variable __serr__ receives parsing error message, if __rc__ is 0.


#get-body
Get HTTP request body to variable __req_body__

#eat-out
Eat accumulated output (nullify it), usually because we did processing and do not want empty lines to show.

#flush-out
Flush accumulated output, used to show Wait... to the user before long operation.

#replace-output AbsFilePath [SectionFrom SectionTo]
Eat output and replace it with contents of file at AbsFilePath (absolute path on the server).
This way you can return log or picture files upon HotMeal-based verification.
If SectionFrom SectionTo are specified, then return only section of the file, starting at a line after line that starts with SectionFrom and ending at a line just before the line that starts with SectionTo.

#return
- When within a procedure, return from the procedure.
- Otherwise, send 200-OK response to browser, with the accumulated text output.

#eof
Simulate end-of-this-file, to close file called by #include.
Can be used only inside include file.

HTTP Calls

#redirect UrlStr
Browser-Redirect to UrlStr, using GET verb.

This Server Responds with 'Location: UrlStr' header and no body is sent back.
Browser calls URL specificed in UrlStr with GET verb.


#redirect-post UrlStr
Browser-Redirect to UrlStr, using POST verb.

This Server Responds with 'Location: UrlStr' header and no body is sent back.
Browser calls URL specificed in UrlStr with GET verb.


#forward UrlStr
Forward response to another server at UrlStr.

Response received from this other server (both headers and body) is returned to the client of this server.

Usually this is used to call internal servers that cannot be reached from outside.

Example:
HotMeal server is fronting for PHP server.
PHP server is on internal network and can be accessed only from HotMeal server.
It is good for heavier PHP server, as it cannot be subject to DOS attacks.


#http-call UrlStr BodyStr [HeadersStr] [VerbStr]
Make HTTP(S) call to UrlStr, with body from BodyStr, and headers from HeaderStr (use \r\n as a separator), and verb VerbStr (default verb is POST).
Variable __rc__ receives success code (1 or 0).
Variable __serr__ receives error message, if __rc__ is 0.

In case of success variable __resp_body__ is set to unparse HTTP body returned by the call. and variables __ret_FieldName__ are set to form-parsed body details, similar to how it is done in #parse-form.


#http-call-inline UrlStr BodyStr [HeadersStr] [VerbStr]
Same as #http-call but inline output body of call to output and do not try to parse it.

Variable __rc__ receives success code (1 or 0).
Variable __serr__ receives error message, if __rc__ is 0.

In case of success HTTP call response body is added to our response body, so effectively it is inlined.

Response of HTTP call is added to our response without parsing.


#http-call-wait UrlStr BodyStr [HeadersStr] [VerbStr]
Make HTTP(S) call to url, with body, and headers.

If HTTP call returns status code 201 or 206, this is partial progress reported by the called server.
Spit out received body to our output and flush, as this is progress message.

Then call the same URL again and wait for return of status code 200.
Once it happens, add output of HTTP call to our output and flush.

Variable __rc__ receives success code (1 or 0).
Variable __serr__ receives error message, if __rc__ is 0.


#http-calls-progress UrlStr
Display list of active HTTP calls with progress, at the UrlStr on server.

To be used by progress checker threads for HTTP calls that take really long time.

Variable __rc__ receives success code (1 or 0).
Variable __serr__ receives error message, if __rc__ is 0.


Authentication

#auth-digest UserId AuthRealm DigestHash
Check for Digest Authentication in headers for UserId with DigestHash.

If positive auth is missing then request Authentication by returning HTTP Status Code 401 and appropriate headers.

If authentication is incorrect, return HTTP error to output.


#generate-google-auth-key IssuerStr EmailStr
Generate unique key for use with Google Authenticator.
Stores key to variables __key__ and __qr_code_image_url__.
__key__ - key as a base32 encoded string. To be stored to the account's record in DB.
__qr_code_image_url__ - key as a QR code image URL, to be shown as <img src=__qr_code_image_url__> on the account setup page.


#check-google-auth-key CodeStr UserIdStr KeyStr
Check code generated by Google Authenticator application.
CodeStr - code entered by user;
UserIdStr - user id or email;
KeyStr - base32-encoded key, read from the account's record in DB, generated by #generate-google-auth-key.
Writes result to __rc__ variable: 1 - good code, 0 - wrong code.


Messaging

#alert MsgStr
Issue Critical Level alert, with text from MsgStr.


#email RecipientEmailStr SubjectStr MessageStr
#email-named RecipientEmailStr RecipientNameStr SubjectStr MessageStr
Send Email message to ["RecipientNameStr"] RecipientEmailStr, with subject from SubjectStr and body from MessageStr.

Variable __rc__ receives success code (1 or 0).
Variable __serr__ -- if __rc__ is 0, receives error message.
Variable __respcode__ -- if not 0 then a 3-digit response code returned by SMTP server.
Variable __toretry__ -- 1 means message delivery will be retried, 0 means no retries.


#sms PhoneStr MessageStr
Send SMS message (via Twilio) to PhoneStr (must start with +CountyCode), with body from MessageStr.

Variable __rc__ receives success code (1 or 0).
Variable __serr__ receives error message, if __rc__ is 0.

```
Here're a few code examples:
```html
#if ! __r__init__ is-defined 

    #parse-cookies

    #define __b__fallback_language__ "eng"

    // We will set language to default for start. If we will find cookie with
    // another language and it's valid we will stick to it. 
    // The same with language which is stored in admin settings.
    #define __b__language__ ##__b__fallback_language__##

    // Here we configure all languages, awailable for user
    #define __b__languages_json__ {"langs":{"rus":"Русский","eng":"English","deu":"Deutch","jpn":"日本"}}

    // Counting languages
    // The number of languages will be the LENGTH of this variable
    // We use this variable to show (or not) language switches
    #define __b__languages_count__ ""
    #parse-json __b__languages_json__ langs
    #foreach __key__ ##__value__##
        #append __b__languages_count__ "*"
    #endfor

    // Now we will check if we have cookie with language
    #if __cookie__language__ is-defined && __b__language__ != __cookie__language__
        #define __t__language_in_cookie_is_valid__ 0
        #parse-json __b__languages_json__ langs
        #foreach __key__ ##__value__##
            #parse-map ##__key__##
            #if __cookie__language__ == ##__name__##
                #define __t__language_in_cookie_is_valid__ 1
            #endif    
        #endfor
        #if __t__language_in_cookie_is_valid__ is-true
            // If language in cookie is valid
            #define __b__language__ ##__cookie__language__##
        #else
            // TODO: What to do with cookie if the language is not valid?
            // For now we will do nothing as correct fallback language will 
            // be anyway loaded and the program will work correctly.
            // One consideration is that we can set new cookie with fallback 
            // language but the other is that it's not necessary cause
            // fallback language will be loaded anyway
        #endif 
    #else
        // TODO: set cookie with language?
    #endif

    // Immediately load phrases
    #include-once /langs/##__b__language__##/dict.html

    // Try to load language
    #if ##__l__lang__lang__## != ##__b__language__##
        // Language did not load correctly, fallbacking
        #define __b__language__ ##__b__fallback_language__##
        #include-once /langs/##__b__language__##/dict.html
    #endif

    #define __r__init__ 1

#endif
```
Another example:
```html
#define-long __tabs_json__
[{"id":"tab-left-folder", "href":"#tab-left-folder-content", "label":"##__l__jobs__left_side__##", "active":1},
{"id":"tab-right-folder", "href":"#tab-right-folder-content", "label":"##__l__jobs__right_side__##", "active":0},
{"id":"tab-general", "href":"#tab-general-content", "label":"##__l__templates__program_options__general__##", "active":0, "content": "#call GeneralBlock()"},
{"id":"tab-filters", "href":"#tab-filters-content", "label":"##__l__templates__program_options__filters__##", "active":0},
{"id":"tab-auto", "href":"#tab-auto-content", "label":"##__l__templates__program_options__general__auto__##", "active":0},
{"id":"tab-analyze", "href":"#tab-analyze-content", "label":"##__l__jobs__analyze__##", "active":0},
{"id":"tab-sync", "href":"#tab-sync-content", "label":"##__l__jobs__sync__##", "active":0},
{"id":"tab-recycled-history", "href":"#tab-recycled-content", "label":"##__l__jobs__recycled_history__##", "active":0},
{"id":"tab-speed-limits", "href":"#tab-speed-content", "label":"##__l__jobs__speed_limits__##", "active":0},
{"id":"tab-error-handling", "href":"#tab-errors-content", "label":"##__l__jobs__errors_conflicts__##", "active":0},
{"id":"tab-scripts", "href":"#tab-scripts-content", "label":"##__l__jobs__scripts__##", "active":0}]
#end-define
#parse-json __tabs_json__ ""
#define __tab_items__ ##__value__##

#define-long __server_accounts_json__
[{"title":"##__l__jobs__my_computer__title__##","key":"file://","properties":[]},
{"title":"##__l__jobs__apple_file_protocol__title__##","key":"afpd://","properties":[{"property":"sUrl","cliKey":"/f"},{"property":"sHomePath","cliKey":null},{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"}]},
{"title":"Net Shares (Win-SMB)","key":"smb://","properties":[{"property":"sUrl","cliKey":"/f"},{"property":"sHomePath","cliKey":null},{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"}]},
{"title":"Net Shares (Sib-SMB)","key":"smbd://","properties":[{"property":"sUrl","cliKey":"/f"},{"property":"sHomePath","cliKey":null},{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"}]},
{"title":"##__l__jobs__gs_connect__title__##","key":"gstps://","properties":[{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"sUrl","cliKey":"/f"},{"property":"sPrivateKeyPath","cliKey":"/pk"},{"property":"bGstpPlainDirect","cliKey":"/gstp-plain-direct"},{"property":"bUseProxy","cliKey":"/useproxy"}]},
{"title":"RealDisk Online Storage","key":"gstore://","properties":[{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"}]},
{"title":"##__l__jobs__ftp__title__##","key":"ftp://","properties":[{"property":"sUrl","cliKey":"/f"},{"property":"sHomePath","cliKey":null},{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"bSecureConn","cliKey":null},{"property":"bEncodeUTF8","cliKey":"/utf8-"},{"property":"bUseProxy","cliKey":"/useproxy"},{"property":"bIgnoreBadCerts","cliKey":"/bad-certs"},{"property":"bActiveMode","cliKey":"/active"},{"property":"bUseEPSV","cliKey":"/epsv"},{"property":"bImplicitMode","cliKey":"/implicit"},{"property":"bUseMDTM","cliKey":"/mdtm"},{"property":"bUseMLSD","cliKey":"/mlsd"},{"property":"bUseListLA","cliKey":"/listla"},{"property":"bMoveLevelOnly","cliKey":"/move-level-only"},{"property":"bDataConnSessionReuse","cliKey":"/tls-sess-reuse"}]},
{"title":"##__l__jobs__ftp__title__##S","key":"ftps://","properties":[{"property":"sUrl","cliKey":"/f"},{"property":"sHomePath","cliKey":null},{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"bSecureConn","cliKey":null},{"property":"bEncodeUTF8","cliKey":"/utf8-"},{"property":"bUseProxy","cliKey":"/useproxy"},{"property":"bIgnoreBadCerts","cliKey":"/bad-certs"},{"property":"bActiveMode","cliKey":"/active"},{"property":"bUseEPSV","cliKey":"/epsv"},{"property":"bImplicitMode","cliKey":"/implicit"},{"property":"bUseMDTM","cliKey":"/mdtm"},{"property":"bUseMLSD","cliKey":"/mlsd"},{"property":"bUseListLA","cliKey":"/listla"},{"property":"bMoveLevelOnly","cliKey":"/move-level-only"},{"property":"bDataConnSessionReuse","cliKey":"/tls-sess-reuse"}]},
{"title":"##__l__jobs__sftp__title__##","key":"sftp://","properties":[{"property":"sUrl","cliKey":"/f"},{"property":"sHomePath","cliKey":null},{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"sPrivateKey","cliKey":null},{"property":"bEncodeUTF8","cliKey":"/utf8-"},{"property":"bUseProxy","cliKey":"/useproxy"},{"property":"bIgnoreBadCerts","cliKey":"/bad-certs"}]},
{"title":"##__l__jobs__amazons3__title__##","key":"s3s://","properties":[{"property":"sUrl","cliKey":"/f"},{"property":"sHomePath","cliKey":null},{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"bHostBasedAddr","cliKey":"/hostbased"},{"property":"bUsGovCloud","cliKey":"/us-gov-cloud"},{"property":"sStorageClassA","cliKey":null},{"property":"bRequireCheckSum","cliKey":"/require-checksum"},{"property":"bCacheFileModTime","cliKey":"/cache-filemodtime"},{"property":"nUploadChunksThreads","cliKey":"/upload-chunks-threads"},{"property":"sGeoLocationA","cliKey":null},{"property":"sAccessPolicyA","cliKey":"/accesspolicy"},{"property":"bServerSideEncryption","cliKey":"/server-encrypt"},{"property":"sServerEncrKeyA","cliKey":"/sec"}]},
{"title":"Google Cloud Storage","key":"gcs://","properties":[{"property":"sHomePath","cliKey":null},{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"sGeoLocationA","cliKey":null}]},
{"title":"##__l__jobs__mega_cloud__title__##","key":"mega://","properties":[{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"sUrlA","cliKey":"/f"}]},
{"title":"MS Azure Blobs","key":"azures://","properties":[{"property":"sHomePath","cliKey":null},{"property":"sUrlA","cliKey":"/f"},{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"sGeoLocationA","cliKey":null},{"property":"bUsGovCloud","cliKey":"/us-gov-cloud"},{"property":"sStorageClassA","cliKey":null},{"property":"nUploadChunksThreads","cliKey":"/upload-chunks-threads"}]},
{"title":"MS Azure Files","key":"azurefiles://","properties":[{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"bUsGovCloud","cliKey":"/us-gov-cloud"},{"property":"sUrlA","cliKey":"/f"}]},
{"title":"pCloud","key":"pcloud://","properties":[{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"nUploadChunksThreads","cliKey":"/upload-chunks-threads"},{"property":"sUrlA","cliKey":"/f"}]},
{"title":"##__l__jobs__backblaze_b2__title__##","key":"backblaze://","properties":[{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"nUploadChunksThreads","cliKey":"/upload-chunks-threads"},{"property":"sUrlA","cliKey":"/f"}]},
{"title":"##__l__jobs__webdav__title__## (HTTPS)","key":"https://","properties":[{"property":"sUrl","cliKey":"/f"},{"property":"sHomePath","cliKey":null},{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"bSecureConn","cliKey":null},{"property":"sPrivateKeyPath","cliKey":"/pk"},{"property":"bWinInet","cliKey":"/wininet"},{"property":"bUseProxy","cliKey":"/useproxy"},{"property":"bEncodeUTF8","cliKey":"/utf8-"},{"property":"bIgnoreBadCerts","cliKey":"/bad-certs"}]},
{"title":"##__l__jobs__webdav__title__## (HTTP)","key":"http://","properties":[{"property":"sUrl","cliKey":"/f"},{"property":"sHomePath","cliKey":null},{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"bSecureConn","cliKey":null},{"property":"sPrivateKeyPath","cliKey":"/pk"},{"property":"bWinInet","cliKey":"/wininet"},{"property":"bUseProxy","cliKey":"/useproxy"},{"property":"bEncodeUTF8","cliKey":"/utf8-"},{"property":"bIgnoreBadCerts","cliKey":"/bad-certs"}]},
{"title":"##__l__jobs__office365__title__##","key":"msgraph://","properties":[{"property":"sUrlA","cliKey":"/f"},{"property":"sTenant","cliKey":null},{"property":"bGraphGroupReadPermissions","cliKey":null},{"property":"bGraphDirectoryReadPerms","cliKey":null}]},
{"title":"##__l__jobs__dropbox__title__##","key":"dropbox://","properties":[{"property":"sUrlA","cliKey":"/f"},{"property":"nUploadChunksThreads","cliKey":"/upload-chunks-threads"}]},
{"title":"Google Team Drive","key":"gteamdrive://","properties":[{"property":"sUrlA","cliKey":"/f"},{"property":"bExportNativeDocs","cliKey":"/export-native-docs"}]},
{"title":"##__l__jobs__google_drive__title__##","key":"gdrive://","properties":[{"property":"sUrlA","cliKey":"/f"},{"property":"bExportNativeDocs","cliKey":"/export-native-docs"}]},
{"title":"Google Photos","key":"gphotos://","properties":[{"property":"sUrlA","cliKey":"/f"},{"property":"bExportNativeDocs","cliKey":"/export-native-docs"}]},
{"title":"Google Docs","key":"gdocs3://","properties":[{"property":"sUrlA","cliKey":"/f"},{"property":"bExportNativeDocs","cliKey":"/export-native-docs"}]},
{"title":"##__l__jobs__box_com__title__##","key":"box://","properties":[{"property":"sUrlA","cliKey":"/f"},{"property":"bExportNativeDocs","cliKey":"/export-native-docs"}]},
{"title":"Apple iCloud Drive","key":"icloud://","properties":[{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"bCnICloud","cliKey":"/cn-icloud"}]},
{"title":"Apple iCloud Photos","key":"iphotos://","properties":[{"property":"sUserIdA","cliKey":"/userid"},{"property":"sPassword","cliKey":"/password"},{"property":"bCnICloud","cliKey":"/cn-icloud"}]},
{"title":"##__l__jobs__media_transfer_protocol__title__##","key":"mtp://","properties":[{"property":"sUrl","cliKey":"/f"},{"property":"sHomePath","cliKey":null}]},
{"title":"One File","key":"onefile://","properties":[{"property":"sUrl","cliKey":"/f"}]}]
#end-define

#parse-json __server_accounts_json__ ""
#define __server_accounts__ ##__value__##

// another html file:
#include-once /ui/crud/job/job-edit-modal/variables.html
<div class="col-md-3 tabs">
    <ul class="nav tabs-left sideways">

    #foreach __tab_item__ ##__tab_items__##
        #parse-map __tab_item__
        <li 
        #if ##__value_id__## != ""
            id="##__value_id__##"
        #endif
        #if ##__value_active__## is-true
            class="active"
        #endif
        ><a href="##__value_href__##" data-toggle="tab">##__value_label__##</a></li>
    #endfor
    </ul>
</div>
```
And the last example:
```html
#include-once /ui/auth/constants.html
#include-once /ui/templates/html-elements.html

#procedure ManualAccountSelect(__side__)
<div class="form-group" style="display: flex; align-items: center;">
    <label class="control-label col-md-2">##__l__jobs__file_system__##</label>
    <div class="col-md-10">
        <select class="form-control static selectpicker" id="fs-##__side__##">
            #foreach __server_account__ ##__server_accounts__##
            #parse-map __server_account__
                <option value="##__value_key__##">##__value_title__##</option>
            #endfor
        </select>
    </div>
</div>
<div class="form-group" style="display: flex; align-items: center;">
    <label class="control-label col-md-2">##__l__jobs__path__##</label>
    <div class="col-md-10" style="display: flex;">
        <div id="pref-##__side__##" style="padding-right: 5px;  padding-top:2px; color:#555;">file://</div>
        <div style="flex-grow: 100;"><input  name="f##__side__##" class="form-control pather" autocomplete="off" type="text"></div>
    </div>
</div>
<script>
    const $selectManual##__side__## = $('#fs-##__side__##');
    $selectManual##__side__##.select2({ width: '100%' });
    $selectManual##__side__##.on('change', function() {
        const $pref##__side__## = $('#pref-##__side__##');
        $pref##__side__##.text($selectManual##__side__##.val());
    });
</script>
#endproc

#procedure ServerAccountSelect(__side__)
<div class="form-group" style="display: flex; align-items: center;">
    <label class="control-label col-md-2">##__l__domain__account__##</label>
    <div class="col-md-10">
        <select class="form-control static selectpicker" id="server-acct-##__side__##" name="k##__side__##">
        </select>
    </div>
</div>

<div class="form-group" style="display: flex; align-items: center;">
    <label class="control-label col-md-2">##__l__domain__folder__##</label>
    <div class="col-md-10">
        <select class="form-control static selectpicker" id="folder-##__side__##" name="d##__side__##">
        </select>
    </div>
</div>
// render account & folder options
<script>

</script>
// select2 functions
<script>
    function initAccountSelect(side) {
        let dataUrl = "/ui/tables/accounts";
        Select2Wrapper({
            element: $("#server-acct-" + side),
            data_url: "/ui/tables/accounts",
            placeholder: window.lang["accounts"],
            tags: false,
            minimumInputLength: 0,
            selecting: function (e) {
                const selectionKey = e.params.args.data.id;

                $.ajax({
                    url: "/ui/tables/server-folders",
                    data: {
                        account_key: selectionKey,
                        start: 0,
                        length: 1
                    },
                    success: function (response) {
                        const responseJson = JSON.parse(response);
                        const [data] = responseJson.data;
                        const $folderSelect = $('#folder-' + side);
                        $folderSelect.empty();
                        $folderSelect.append(new Option(data.folder_url, data.folder_url, false, false));
                        $folderSelect.trigger('change');
                    }
                });
            },
            templateResult: function (item) {
                if (item.loading) {
                    return "Loading...";
                }
                return item.text = item.account_key;
            },
           
        });
    }
    function initFolderSelect(side) {
        Select2Wrapper({
            element: $("#folder-" + side),
            data_url: "/ui/tables/server-folders",
            placeholder: window.lang["folders"],
            tags: true,
            minimumInputLength: 0,
            extraAjaxParameter: {
                "account_key": function () {
                    return $('#server-acct-' + side).val()
                }
            },
            selecting: function (e) {
                console.log("selecting!:", e)
            },
            templateResult: function (item) {
                if (item.loading) {
                    return "Loading...";
                }

                return item.text = item.folder_url;
            },
        });

    }
</script>
<script>
    initAccountSelect(##__side__##);
    initFolderSelect(##__side__##);
</script>
#endproc

#procedure ServerAccountOptions(__side__)

#endproc


#procedure Side(__side__)
    #include-once /ui/templates/utils.html
    #if ##__is_acc_sync_enabled__## is-false
        <div style="display: flex; flex-direction: column; row-gap: 16px;">
            <div class="togglebutton">
                <label>
                    <input type="checkbox" id="cb-use-manual-server-account-##__side__##"> ##__l__jobs__use_manual_accounts__##
                </label>
            </div>
            <div id="old-scheme-account-select-##__side__##" style="display: flex; flex-direction: column; row-gap: 16px;" class="hidden">
                #call ManualAccountSelect(##__side__##)
            </div>
        </div>
    #endif
    <div id="new-scheme-account-select-##__side__##" style="display: flex; flex-direction: column; row-gap: 16px; padding-top: 16px;">
        #call ServerAccountSelect(##__side__##)
    </div>
    <hr>
    <div style="display: flex; flex-direction: column; row-gap: 16px;">
    </div>
    <script>
        #if ##__is_acc_sync_enabled__## is-false
            const $toggle##__side__## = $('#cb-use-manual-server-account-##__side__##');
            $toggle##__side__##.on("change", function() {
                const $oldScheme = $('#old-scheme-account-select-##__side__##');
                const $newScheme = $('#new-scheme-account-select-##__side__##');
                if ($toggle##__side__##.is(':checked')) {
                    $oldScheme.removeClass('hidden');
                    $newScheme.addClass('hidden');
                } else {
                    $oldScheme.addClass('hidden');
                    $newScheme.removeClass('hidden');
                }
            });
        #endif
    </script>
#endproc

#procedure GeneralBlock()
    <div>
        <div class="col-lg-12">
            <h5><b>##__l__jobs__job_type_and_file_deletions__##</b></h5>
        <hr>
            <div class="select-dir" title="##__l__jobs__preferred_direction_of_sync__## ##__l__jobs__two_way_jobs_keep_left_and_right__## ##__l__jobs__one_way_jobs_propogate_file_changes_from_left_to_right__##">
                <label class="control-label">##__l__jobs__job_type_and_direction__##</label>
                <select class="form-control static" name="dir">
                    <option value="1">##__l__jobs__backup_left_to_right__##</option>
                    <option value="0">##__l__jobs__synchronize_2_way__##</option>
                    <option value="2">##__l__jobs__backup_right_to_left__##</option>
                </select>
            </div>
            #call Checkbox("##__l__jobs__propagate_deletions__##","deletions","deletions","","##__l__jobs__on_if_a_file_or_folder_has_been_deleted__##")
            #call Checkbox("##__l__jobs__create_left_right_sync_folders_if_they_are_not_found__##","create-if-not-found","create-if-not-found","","##__l__jobs__goodsync_will_create_left_right_sync_folders__##")
        </div>
        <div class="col-lg-12">
            <h5><b>##__l__jobs__advanced__##</b></h5>
            <hr>
            #call Checkbox("##__l__jobs__fast1way_sync__##","fast-1way","fast-1way","",##__l__jobs__fast1way_sync_helper_text__##)
            #call Checkbox("##__l__jobs_ignore_changes_on_dest_side##","ignore-changes-on-dest-side","ignore-changes-on-dest-side","","##__l__jobs_ignore_changes_on_dest_side##")
            #call Checkbox("##__l__jobs__move_mode_delete_source_after_copy__##", "move-mode", "move-mode", "", "##__l__jobs__one_way_jobs_delete_source_files_after_copying__##")
            #call Checkbox("##__l__jobs__move_mode_delete_empty_folders_after_copy__##", "delete-empty-folders-on-move", "delete-empty-folders-on-move", "", "##__l__jobs__delete_empty_folders_in_move_mode__##")
        </div>
    </div>
#endproc

// another html file:
#include-once /ui/crud/job/job-edit-modal/job-edit-modal-sections.html
<div class="col-md-9 col-no-padding-right">
    <div class="tab-content" id="home-options">
        <div class="tab-pane active" id="tab-left-folder-content">
            #call Side(1)
        </div>
        <div class="tab-pane" id="tab-right-folder-content">
            #call Side(2)
        </div>
        <div class="tab-pane" id="tab-general-content">
            #call GeneralBlock()
        </div>
        <div class="tab-pane" id="tab-performance-content">
            #call PerformanceBlock()
        </div>
        <div class="tab-pane" id="tab-history-content">
            #call HistoryBlock()
        </div>
        <div class="tab-pane" id="tab-filters-content">
            #call FiltersBlock()
        </div>
        <div class="tab-pane" id="tab-auto-content">
            #call AutoBlock()
        </div>
        <div class="tab-pane" id="tab-scripts-content">
            #call ScriptsBlock()
        </div>

        <div class="tab-pane" id="tab-advanced-content">
            #call AdvancedBlock()
        </div>
    </div>
</div>
```