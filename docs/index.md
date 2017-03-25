waffles-muggles
===============
CS 5150 Navigation in Library Stacks.

**Version:** 1.0.0

### /stacks
---
##### ***GET***
**Description:** Returns information about stacks at a given floor.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| floor_id | query | Floor to list stacks | Yes | integer |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | An array of stacks | [ [Stack](#stack) ] |
| default | Unexpected error | [Error](#error) |

##### ***POST***
**Description:** Adds a new stack to a given floor.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Stack with default ID to be added | Yes | [Stack](#stack) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | string |
| 405 | Invalid input |

##### ***PUT***
**Description:** Edit a stack.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Stack with given ID to be updated | Yes | [Stack](#stack) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | string |
| 405 | Invalid input |

### /stacks/{id}
---
##### ***GET***
**Description:** Returns information about the stack of a specified ID.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path | ID of stack | Yes | integer |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | A stack | [Stack](#stack) |
| default | Unexpected error | [Error](#error) |

##### ***DELETE***
**Description:** Delete a stack.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path | ID of stack | Yes | integer |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | string |
| 405 | Invalid input |

### /floors
---
##### ***GET***
**Description:** Returns information about floors at a given library.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| library_id | query | Library to list floors | Yes | integer |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | An array of floors | [ [Floor](#floor) ] |
| default | Unexpected error | [Error](#error) |

##### ***POST***
**Description:** Adds a new floor to a given library.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Floor with default ID to be added | Yes | [Floor](#floor) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | string |
| 405 | Invalid input |

##### ***PUT***
**Description:** Edit a floor.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Floor with given ID to be updated | Yes | [Floor](#floor) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | string |
| 405 | Invalid input |

### /floors/{id}
---
##### ***GET***
**Description:** Returns information about the floor of a specified ID.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path | ID of floor | Yes | integer |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | A floor | [Floor](#floor) |
| default | Unexpected error | [Error](#error) |

##### ***DELETE***
**Description:** Delete a floor.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path | ID of floor | Yes | integer |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | string |
| 405 | Invalid input |

### /libraries
---
##### ***GET***
**Description:** Returns information about libraries.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | An array of libraries | [ [Library](#library) ] |
| default | Unexpected error | [Error](#error) |

##### ***POST***
**Description:** Adds a new library.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Library with default ID to be added | Yes | [Library](#library) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | string |
| 405 | Invalid input |

##### ***PUT***
**Description:** Edit a library.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Library with given ID to be updated | Yes | [Library](#library) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | string |
| 405 | Invalid input |

### /libraries/{id}
---
##### ***DELETE***
**Description:** Delete a library.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path | ID of library | Yes | integer |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | string |
| 405 | Invalid input |

### /search
---
##### ***GET***
**Description:** Find stacks by a call number.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| keyword | query | Call number of search | Yes | string |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | An array of search results | [ [SearchResult](#searchResult) ] |
| default | Unexpected error | [Error](#error) |

### /rules
---
##### ***GET***
**Description:** Returns information about rules.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | An array of rules | [ [Rule](#rule) ] |
| default | Unexpected error | [Error](#error) |

##### ***POST***
**Description:** Adds a new rule.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| body | body | Rule with default ID to be added | Yes | [Rule](#rule) |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | string |
| 405 | Invalid input |

### /rules/{id}
---
##### ***DELETE***
**Description:** Delete a rule.

**Parameters**

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ---- |
| id | path | ID of rule | Yes | integer |

**Responses**

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | string |
| 405 | Invalid input |

### Models
---
<a name="stack"></a>**Stack**  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | integer | Unique ID representing a stack | No |
| cx | integer | Shape center (anchor) x | No |
| cy | integer | Shape center (anchor) y | No |
| lx | integer | Shape size x | No |
| ly | integer | Shape size y | No |
| rotation | integer | Shape rotation | No |
| startClass | string | Start class alpha e.g. QA | No |
| startSubclass | integer | Start class number e.g. 67 | No |
| startSubclass2 | string | Additional startsubclass | No |
| endClass | string | End class alpha e.g. QB | No |
| endSubclass | integer | End class number e.g. 67 | No |
| endSubclass2 | string | Additional end subclass | No |
| oversize | integer | Size property | No |
| floor | integer | Floor located on | No |
<a name="floor"></a>**Floor**  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | integer | Unique ID representing a floor | No |
| name | string | Name of floor | No |
| size_x | integer | Bounding box size x | No |
| size_y | integer | Bounding box size y | No |
| geojson | string | Fine shape | No |
| library | integer | Library located in | No |
<a name="library"></a>**Library**  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | integer | Unique ID representing a library | No |
| name | string | Name of library | No |
| latitude | string | Latitude of library | No |
| longitude | string | Longitude of library | No |
<a name="searchResult"></a>**SearchResult**  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| result_type | string | Type of result | No |
| result_id | integer | ID of result | No |
| result | string | Displayed text of result | No |
<a name="rule"></a>**Rule**  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| rule_type | string | Type of rule | No |
| rule_id | integer | ID of rule | No |
| call_number | string | Call number applying the rule | No |
| rule | string | Rule to interpret | No |
<a name="error"></a>**Error**  

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| code | integer |  | No |
| message | string |  | No |
| fields | string |  | No |