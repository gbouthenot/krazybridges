#!/bin/bash
(
 cat jquery.min.js && echo &&
 cat jquery-ui.min.js && echo &&
 cat jquery.enhanced.cookie.js && echo &&
 cat bootstrap.min.js && echo &&
 cat bootstrap-toggle.min.js && echo &&
 cat jquery.bootstrap-touchspin.min.js && echo
) > jboot.min.js
