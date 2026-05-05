package OpenSSL::safe::installdata;

use strict;
use warnings;
use Exporter;
our @ISA = qw(Exporter);
our @EXPORT = qw($PREFIX
                  $BINDIR $BINDIR_REL
                  $LIBDIR $LIBDIR_REL
                  $INCLUDEDIR $INCLUDEDIR_REL
                  $APPLINKDIR $APPLINKDIR_REL
                  $ENGINESDIR $ENGINESDIR_REL
                  $MODULESDIR $MODULESDIR_REL
                  $PKGCONFIGDIR $PKGCONFIGDIR_REL
                  $CMAKECONFIGDIR $CMAKECONFIGDIR_REL
                  $VERSION @LDLIBS);

our $PREFIX             = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl';
our $BINDIR             = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/apps';
our $BINDIR_REL         = 'apps';
our $LIBDIR             = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl';
our $LIBDIR_REL         = '.';
our $INCLUDEDIR         = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/include';
our $INCLUDEDIR_REL     = 'include';
our $APPLINKDIR         = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/ms';
our $APPLINKDIR_REL     = 'ms';
our $ENGINESDIR         = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/engines';
our $ENGINESDIR_REL     = 'engines';
our $MODULESDIR         = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/providers';
our $MODULESDIR_REL     = 'providers';
our $PKGCONFIGDIR       = '';
our $PKGCONFIGDIR_REL   = '';
our $CMAKECONFIGDIR     = '';
our $CMAKECONFIGDIR_REL = '';
our $VERSION            = '3.3.0';
our @LDLIBS             =
    # Unix and Windows use space separation, VMS uses comma separation
    split(/ +| *, */, '-ldl ');

1;
