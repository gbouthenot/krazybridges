#!/bin/bash
(
 cat bootstrap-slate.min.css && echo &&
 cat bootstrap-toggle.min.css && echo &&
 cat jquery.bootstrap-touchspin.min.css && echo &&
 cat common.css && echo
) > css.css
