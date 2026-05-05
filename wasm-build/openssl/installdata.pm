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

our $PREFIX             = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/build';
our $BINDIR             = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/build/bin';
our $BINDIR_REL         = 'bin';
our $LIBDIR             = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/build/lib';
our $LIBDIR_REL         = 'lib';
our $INCLUDEDIR         = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/build/include';
our $INCLUDEDIR_REL     = 'include';
our $APPLINKDIR         = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/build/include/openssl';
our $APPLINKDIR_REL     = 'include/openssl';
our $ENGINESDIR         = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/build/lib/engines-3';
our $ENGINESDIR_REL     = 'lib/engines-3';
our $MODULESDIR         = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/build/lib/ossl-modules';
our $MODULESDIR_REL     = 'lib/ossl-modules';
our $PKGCONFIGDIR       = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/build/lib/pkgconfig';
our $PKGCONFIGDIR_REL   = 'lib/pkgconfig';
our $CMAKECONFIGDIR     = '/Users/cslee/Desktop/cslee/00.cslee/dev-cs/blog/wasm-build/openssl/build/lib/cmake/OpenSSL';
our $CMAKECONFIGDIR_REL = 'lib/cmake/OpenSSL';
our $VERSION            = '3.3.0';
our @LDLIBS             =
    # Unix and Windows use space separation, VMS uses comma separation
    split(/ +| *, */, '-ldl ');

1;
